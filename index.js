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
const job = new CronJob("*/5 * * * *", createBrowser, false, "Asia/Singapore");

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
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/68.0.3419.0 Safari/537.36"
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


  var data = await page.evaluate(() => {
  try {
    // Logging the window.initialState for debugging purposes
    console.log(window.initialState);
    return window.initialState;
  } catch (error) {
    console.error(error);
    return null;
  }
});

  await page.close();


  if (data != undefined) {
    let listings = [];
    console.log(data.ProfileListing.listingCards.length);
    data.ProfileListing.listingCards.forEach((element) => {
      const name = element.belowFold[0].stringContent;
      const price = element.belowFold[1].stringContent;
      const condition = element.belowFold[3].stringContent;
      const listingID = element.listingID;
      const thumbnailURL = element.thumbnailURL;
      const seller_username =
        data.Listing.listingsMap[element.listingID].seller.username;
      const itemURL = ("https://sg.carousell.com/p/" + name.replace(/[^a-zA-Z ]/g, "-") + "-" + listingID).replace(/ /g, "-");

      listing = {
        name: name,
        price: price,
        condition: condition,
        listingID: listingID,
        thumbnailURL: thumbnailURL,
        seller_username: seller_username,
        itemURL: itemURL
      };
      listings.push(listing)

    });

    var asiaTime = new Date().toLocaleString("en-US", {
      timeZone: "Asia/Shanghai",
    });
    dateTime = new Date(asiaTime);

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
        client.channels.cache.get('813033854091788298')
        .send(json = {
            content: messages[0],
          });
        console.log("Sent: "+ messages[0])
      }
    }

    //  Save for comparison later
    prevListings = listings;
  } else {
    console.log("Error loading page");
  }
  
}



//create discord string or embed
function createListingsStr(listings) {
  var messages = [];
  listings.forEach((listing) => {
    var message = "";
    // message += "Name: " + listing.name + "\n";
    // message += "Price: " + listing.price + "\n";
    // message += "Condition: " + listing.condition + "\n";
    // message += "Seller: " + listing.seller_username + "\n";
    // message += "Link: " + listing.itemURL + "\n";
    // message += "Thumbnail: " + listing.thumbnailURL;
    
    message += listing.thumbnailURL + "\n";
    message += listing.name + "\n";
    message += listing.price + "\n";
    message += listing.condition + "\n";
    message += listing.itemURL + "\n";
    messages.push(message);
  });
  //console.log(messages[0]);
  return messages;
}

//  Compare listings
function compareListings(array1, array2) {
  ids = new Set(array1.map(({ listingID }) => listingID));
  array2 = array2.filter(({ listingID }) => !ids.has(listingID));
  return array2;
}


async function createBrowser() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--incognito"],
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
  });
  context = await browser.createIncognitoBrowserContext();
  await loadPage()
  browser.close();
}

client.on("messageCreate", (msg) => {
  if (msg.author.id != client.user.id) {
    msg.channel.send(msg.content.split("").reverse().join(""));
  }
});


client.login(process.env.TOKEN);
job.start();
createBrowser();
//createBrowser(loadPage);
