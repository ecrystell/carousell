require('dotenv').config();

const { Client, GatewayIntentBits } = require("discord.js");
const client = new Client({
  intents: Object.keys(GatewayIntentBits).map((a)=>{
    return GatewayIntentBits[a]
  }),
});

const puppeteer = require("puppeteer");
let prevListings = [];
let context;
var count = 0;


const CronJob = require("cron").CronJob;
const job = new CronJob(process.env.SLEEP_TIME, createBrowser, false, "Asia/Singapore");

client.on("ready", () => {
  console.log("I'm in");
  console.log(client.user.username);
});




async function loadPage(){

  console.log("Loading page...");
  count++;
  console.log("Count: " + count);
  var link = "https://sg.carousell.com/u/" + encodeURIComponent(process.env.USER);
  var page = await context.newPage();
  await page.setUserAgent(
    //"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/68.0.3419.0 Safari/537.36"
    //"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36 OPR/102.0.0.0"
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36"
  );
  await page.setCacheEnabled(false);

  await page.setRequestInterception(true);

  page.on("request", (req) => {
    if (req.resourceType() == "document") req.continue();
    else req.abort();
  });


  await page.goto(link, { waitUntil: "load", timeout: 0 });

  // Adding a delay of 5 seconds (you might need to adjust this timing)
  await page.waitForTimeout(5000);

  // var checking;
  var data = await page.evaluate(() => {
    return window.initialState;
``});

  // var data = JSON.parse(await page.evaluate(
  //   async () => Promise.resolve(JSON.stringify(window.initialState))
  // ));

  await page.close();

  //console.log(data);

  if (data != undefined) {
    let listings = [];
    let diffListings = [];
    // console.log(data);
    data.ProfileListing.listingCards.forEach((element) => {
      // console.log(element);
      const name = element.belowFold[0].stringContent;
      const price = element.belowFold[1].stringContent;
      const desc = element.belowFold[2].stringContent;
      const listingID = element.listingID;
      const itemURL = ("https://sg.carousell.com/p/" + name.replace(/[^a-zA-Z ]/g, "-") + "-" + listingID).replace(/ /g, "-");

      listing = {
        name: name,
        price: price,
        desc: desc,
        listingID: listingID,
        itemURL: itemURL
      };
      listings.push(listing)

    });

    var asiaTime = new Date().toLocaleString("en-US", {
      timeZone: "Asia/Shanghai",
    });
    dateTime = new Date(asiaTime);

    let filled = true;
    for (let i=0; i<listings.length; i++) {
      if (listings[i].desc == process.env.DEFAULT_CATEGORY || listings[i].desc == process.env.ANOTHER_CATEGORY) { // if there's any listing with the default category, we assume that details have not been filled in
        filled = false;
        break;
      }
    }
    if (filled) {
      if (prevListings.length == 0)
        console.log("Script starting... we populate the listings!");
      else {
        diffListings = compareListings(prevListings, listings);
        if (diffListings.length == 0) {
          console.log(dateTime + "\t There is no update... :(");
          
        } else {
          console.log(dateTime + "\t There is an update!! :)");
          messages = createListingsStr(diffListings);
          //send discord msg
          for (let i=0; i<messages.length;  i++) {
            client.channels.cache.get(process.env.CHANNEL_ID) 
            .send(json = {
                content: messages[i],
              });
            client.channels.cache.get(process.env.TEST_ID) 
            .send(json = {
                content: messages[i],
              });
            console.log("Sent: "+ messages[i])
            }
          } 

        }
          //  Save for comparison later
        prevListings = listings;       
    } else {
      console.log(dateTime + "\t Details not filled in yet");
    }


  } else {
    console.log("Error loading page");
  }
  
}



//create discord string or embed
function createListingsStr(listings) {
  var messages = [];
  listings.forEach((listing) => {
    var message = "";

    message += listing.name + "\n";
    message += listing.price + "\n";
    message += listing.itemURL;
    messages.push(message);
  });
  //console.log(messages[0]);
  return messages;
}

//  Compare listings
function compareListings(array1, array2) {

  // ids = new Set(array1.map(({ listingID }) => listingID)); 
  // array2 = array2.filter(({ listingID }) => !ids.has(listingID));
  let diff = [];
  let found = false;
  let i = 0;


  while (!found && i < array2.length) {
    if (array1[0].listingID == array2[i].listingID) {
      console.log(array2[i].name)
      found = true;
    } else {
      diff.push(array2[i]);
      i++;
    }
  }
  return diff;
}


async function createBrowser() {
  const browser = await puppeteer.launch({
    headless: "true",
    args: ["--no-sandbox", "--incognito"],
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
  });
  context = await browser.createIncognitoBrowserContext();
  await loadPage()
  browser.close();
}

// client.on("messageCreate", (msg) => {
//   if (msg.author.id != client.user.id) {
//     msg.channel.send(msg.content.split("").reverse().join(""));
//   }
// });


client.login(process.env.TOKEN);
job.start();
//createBrowser();
//createBrowser(loadPage);
