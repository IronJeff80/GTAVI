using System;
using System.Collections.Generic;
using System.IO;
using System.Net;
using System.Text.RegularExpressions;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

public class CPHInline
{
    public bool Execute()
    {
        CPH.TryGetArg("userName", out string user);
        CPH.TryGetArg("userProfileUrl", out string avatar);

        // Twitch First Words has no avatar argument: look it up by login (userName), show the display name (user).
        string source = args.ContainsKey("__source") && args["__source"] != null ? args["__source"].ToString() : "";   // EventType enum, e.g. TwitchFirstWord
        if (!string.IsNullOrEmpty(source) && source.StartsWith("Twitch", StringComparison.OrdinalIgnoreCase))
        {
            if (string.IsNullOrEmpty(avatar) && !string.IsNullOrEmpty(user))
            {
                try
                {
                    var info = CPH.TwitchGetExtendedUserInfoByLogin(user);
                    if (info != null) avatar = info.ProfileImageUrl ?? "";
                }
                catch (Exception ex) { CPH.LogWarn($"[GTA-First5] Twitch avatar lookup failed: {ex.Message}"); }
            }
            if (CPH.TryGetArg("user", out string displayName) && !string.IsNullOrEmpty(displayName)) user = displayName;
        }

        // Twitch test runs (Test button, or the Test trigger with the Twitch import): a random follower instead of the test user.
        bool isTest = args.ContainsKey("isTest") && args["isTest"] != null && args["isTest"].ToString().ToLower() == "true";
        bool twitchSource = !string.IsNullOrEmpty(source) && source.StartsWith("Twitch", StringComparison.OrdinalIgnoreCase);
        if (isTest && (twitchSource || PlatformIsTwitch()))   // PlatformIsTwitch is false for YouTube triggers
        {
            string[] follower = RandomTwitchFollower();
            if (follower != null)
            {
                user = follower[0];
                avatar = follower[1];   // never empty (see RandomTwitchFollower)
            }
        }

        if (!string.IsNullOrEmpty(avatar))
        {
            avatar = Regex.Replace(avatar, @"=s\d+-", "=s600-");
        }

        var data = new
        {
            @event = "GTA_First5",
            user = user ?? "",
            avatar = avatar ?? ""
        };

        CPH.WebsocketBroadcastJson(JsonConvert.SerializeObject(data));
        
        CPH.SetArgument("user", user);
        CPH.SetArgument("avatar", avatar);

        return true;
    }

    // ---- Test runs on Twitch: a random follower of this channel (shared with GTA_First5.cs / GTA_Master_Alerts.cs) ----
    // Platform for Streamer.bot's own Test trigger, which says nothing about Twitch (__source "Test").
    // Set by "[Settings] GTA Platform" (runs when Streamer.bot starts). Platform-specific triggers never use it.
    private bool PlatformIsTwitch()
    {
        string src = args.ContainsKey("__source") && args["__source"] != null ? args["__source"].ToString() : "";
        if (src.Length > 0 && !src.Equals("Test", StringComparison.OrdinalIgnoreCase)) return false;
        try { return string.Equals(CPH.GetGlobalVar<string>("gtaPlatform", true), "twitch", StringComparison.OrdinalIgnoreCase); }
        catch { return false; }
    }

    // Returns { display name, avatar url } for a random follower, or null (no followers, missing scope, API error).
    // The 100 newest followers are fetched at most once per 10 minutes and handed out in shuffled order (alerts and
    // First 5 share the order, so a rare repeat is possible when both run at the same moment).
    private string[] RandomTwitchFollower()
    {
        const string PoolVar = "gtaTestFollowers", AtVar = "gtaTestFollowersAt", BagVar = "gtaTestFollowerBag", FailVar = "gtaTestFollowersFailAt";
        try
        {
            long now = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
            string poolJson = CPH.GetGlobalVar<string>(PoolVar, false);
            long fetchedAt = CPH.GetGlobalVar<long>(AtVar, false);
            JArray pool = null;
            if (!string.IsNullOrEmpty(poolJson) && now - fetchedAt < 600) pool = JArray.Parse(poolJson);
            if (pool == null && now - CPH.GetGlobalVar<long>(FailVar, false) < 60) return null;   // failed recently: don't wait on Twitch again
            if (pool == null)
            {
                CPH.SetGlobalVar(FailVar, now, false);   // cleared below on success
                var me = CPH.TwitchGetBroadcaster();
                if (me == null || string.IsNullOrEmpty(me.UserId)) { CPH.LogWarn("[GTA-Test] Twitch account not connected; using the stock test picture."); return null; }
                ServicePointManager.SecurityProtocol |= SecurityProtocolType.Tls12;
                var req = (HttpWebRequest)WebRequest.Create("https://api.twitch.tv/helix/channels/followers?first=100&broadcaster_id=" + Uri.EscapeDataString(me.UserId));
                req.Headers["Client-Id"] = CPH.TwitchClientId;
                req.Headers["Authorization"] = "Bearer " + CPH.TwitchOAuthToken;
                req.Timeout = 5000;
                req.ReadWriteTimeout = 5000;
                using (var resp = req.GetResponse())
                using (var reader = new StreamReader(resp.GetResponseStream()))
                    pool = JObject.Parse(reader.ReadToEnd())["data"] as JArray;
                if (pool == null || pool.Count == 0)
                {
                    // Twitch only lists followers when the token has moderator:read:followers.
                    CPH.LogWarn("[GTA-Test] Twitch returned no followers (none yet, or the Twitch connection lacks follower access); using the stock test picture.");
                    return null;
                }
                CPH.SetGlobalVar(PoolVar, pool.ToString(Formatting.None), false);
                CPH.SetGlobalVar(AtVar, now, false);
                CPH.UnsetGlobalVar(FailVar, false);
                CPH.UnsetGlobalVar(BagVar, false);
            }

            // Shuffle bag of pool indexes: no repeats until every follower has been shown once.
            string bagJson = CPH.GetGlobalVar<string>(BagVar, false);
            var bag = string.IsNullOrEmpty(bagJson) ? new List<int>() : JsonConvert.DeserializeObject<List<int>>(bagJson);
            bag.RemoveAll(i => i < 0 || i >= pool.Count);
            if (bag.Count == 0) for (int i = 0; i < pool.Count; i++) bag.Add(i);
            int pick;
            lock (Rng) pick = Rng.Next(bag.Count);
            int index = bag[pick];
            bag.RemoveAt(pick);
            CPH.SetGlobalVar(BagVar, JsonConvert.SerializeObject(bag), false);

            var f = pool[index];
            string name = f["user_name"]?.ToString() ?? f["user_login"]?.ToString() ?? "";
            string avatar = "";
            try
            {
                var info = CPH.TwitchGetExtendedUserInfoById(f["user_id"]?.ToString());
                if (info != null) avatar = info.ProfileImageUrl ?? "";
            }
            catch (Exception ex) { CPH.LogWarn($"[GTA-Test] Follower avatar lookup failed: {ex.Message}"); }
            if (string.IsNullOrEmpty(name) || string.IsNullOrEmpty(avatar)) return null;   // keep the stock test name + picture together
            CPH.LogInfo($"[GTA-Test] Random follower for test: {name}");
            return new[] { name, avatar };
        }
        catch (Exception ex)
        {
            CPH.LogWarn($"[GTA-Test] Could not get a random follower: {ex.Message}; using the stock test picture.");
            return null;
        }
    }
    private static readonly Random Rng = new Random();
}
