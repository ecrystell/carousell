const Discord = require("discord.js")
const client = new Discord.Client()

client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`)
})

client.on("message", msg => {
  if (msg.content === "ping") {
    msg.reply("pong");
  }
})

client.login("MTE3MDkxNzMzNzQ5NTUxMTEyMA.GKMFxI.YVtFNBEHX0hPeHM7WDe--TU5d2V01lHii-FkbE")