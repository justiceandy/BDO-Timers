# Black Desert Online Boss Timers

Application allows for tracking boss timers. Access is setup to allow guilds to share timers with only members that are authenticated with discord.
Includes tracking and history of previous spawns, member loot, guild value per kill (total member loot) and much more.

Estimated Spawn timer is calculated from history of previous spawns. Will not be accurate as the time to spawn within the 6 hour window is truly random.

For Casual players without alot of time to spend gaming, this application will allow you to maximize your time and notify you via Push notifications if you are AFK/Tabbed Out.

Code included in this repo allows you to run a private instance of this application. Feel free to use any of the code in this repo to setup your public/private instance. (as long as its not a paid product)


## Requirements
- Node.js
- Redis
- Elastic Search
- Firebase API Token
- Discord API Token

## Config
Configuration Settings need to be set in .env.json file. See /misc/example.env.json


## Licensing
If you want to use this code in any paid product, contact me.

## @KaoKao
Full License to use this application in any capacity is granted to @KaoKaoGames


## Hosting Concerns:
This application can be hosted on AWS "Free" tier if you are into that. Pricing for managed instances is available on the website.
