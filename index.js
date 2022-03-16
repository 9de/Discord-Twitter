const {Client,MessageEmbed} = require('discord.js')
const client = new Client({intents:["GUILDS","GUILD_MESSAGES","GUILD_MESSAGES","GUILD_WEBHOOKS"]})
const request = require('request')
const cheerio = require('cheerio')
const {token,prefix} = require('./settings.json')

client.on('ready', () => {
console.log(`login to ${client.user.tag}`)
client.user.setActivity({name: `Prefix is : ${prefix}`, type:"PLAYING"})

})


client.on('messageCreate', (message) => {
    if(message.author.bot) return;
if(message.content.toLowerCase().startsWith(prefix+'twitter')) {
const args = message.content.slice(prefix.length).trim().split(/ +/g)
const username = args[1]
if(!username) return message.reply({content:"Please Type Your username"})
request.get(`https://twitter.com/${username}`, (err,response,body) => {
    if(body === undefined) return;
    const $ = cheerio.load(body)
    const errorpage = $('div [class="flex-module error-page clearfix"]').text()
if(err  || errorpage || response.statusCode === 404) return message.reply({content:"Can't Find User"});
const nicknname = $(".ProfileHeaderCard-nameLink").text()
const createdat  = $(".ProfileHeaderCard-joinDate").text().trim()
const followers = $("#page-container > div.ProfileCanopy.ProfileCanopy--withNav.ProfileCanopy--large.js-variableHeightTopBar > div > div.ProfileCanopy-navBar.u-boxShadow > div > div > div.Grid-cell.u-size2of3.u-lg-size3of4 > div > div > ul > li.ProfileNav-item.ProfileNav-item--followers > a > span.ProfileNav-value").text()
const avatarurl = $(".ProfileAvatar").find("img.ProfileAvatar-image").attr("src")
const likes = $("#page-container > div.ProfileCanopy.ProfileCanopy--withNav.ProfileCanopy--large.js-variableHeightTopBar > div > div.ProfileCanopy-navBar.u-boxShadow > div > div > div.Grid-cell.u-size2of3.u-lg-size3of4 > div > div > ul > li.ProfileNav-item.ProfileNav-item--favorites > a > span.ProfileNav-value").text()
const following = $("#page-container > div.ProfileCanopy.ProfileCanopy--withNav.ProfileCanopy--large.js-variableHeightTopBar > div > div.ProfileCanopy-navBar.u-boxShadow > div > div > div.Grid-cell.u-size2of3.u-lg-size3of4 > div > div > ul > li.ProfileNav-item.ProfileNav-item--following > a > span.ProfileNav-value").text()

let embed = new MessageEmbed()
.setAuthor({name:`Getting ${username} Information on Twitter`,iconURL:avatarurl})
.setThumbnail(avatarurl)
.setColor("RANDOM")
.addField("User:", username,true)
.addField("CreatedAt:", createdat,true)
.addField("Nickname:", nicknname,true)
.addField("Likes:",likes,true,)
.addField("Followers: ", followers,false)
.addField("following: ", following,false)
.addField("Link:", `[click here](https://twitter.com/${username})`,true)
message.reply({embeds:[embed]})
})
}
})


client.login(token)