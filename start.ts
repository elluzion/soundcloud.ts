import SoundCloud from "./soundcloud";

const soundcloud = new SoundCloud(
  process.env.SOUNDCLOUD_CLIENT_ID,
  process.env.SOUNDCLOUD_OAUTH_TOKEN,
);
(async () => {
  const result = await soundcloud.users.tracks("gingaloid");
  console.log(result);
})();
