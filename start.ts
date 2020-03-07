import SoundCloud from "./soundcloud"

require("dotenv").config()
const soundcloud = new SoundCloud(process.env.SOUNDCLOUD_CLIENT_ID, process.env.SOUNDCLOUD_OAUTH_TOKEN);
(async () => {
    // const result = await soundcloud.tracks.search({q: "virtual riot"})
    const result = await soundcloud.util.downloadTrack("https://soundcloud.com/dwshin/kumiho", "./tracks")
    // await soundcloud.util.downloadPlaylist("https://soundcloud.com/tenpimusic/sets/my-songs", "./tracks")
    // await soundcloud.util.downloadSearch("virtual riot")
    // await soundcloud.util.downloadSearch("virtual riot", "./tracks", 10)
    // const result = await soundcloud.tracks.search({q: "anime"})
    console.log(result)
})()
