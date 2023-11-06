require('dotenv').config();

const { Client, GatewayIntentBits } = require("discord.js");
const client = new Client({
  intents: Object.keys(GatewayIntentBits).map((a)=>{
    return GatewayIntentBits[a]
  }),
});

client.on("ready", () => {
  console.log("I'm in");
  console.log(client.user.username);
});

client.on("messageCreate", (msg) => {
  if (msg.author.id != client.user.id) {
    msg.channel.send(msg.content.split("").reverse().join(""));
  }
});


client.login(process.env.TOKEN);