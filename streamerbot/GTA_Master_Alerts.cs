using System;
using System.Collections.Generic;
using System.IO;
using System.Net;
using System.Text.RegularExpressions;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

public class CPHInline
{
    // Shared recipient arg names for Twitch GiftSub (used by avatar lookup and the giftRec case).
    private static readonly string[] RecipientArgs = { "recipientUserLogin", "recipientLogin", "recipientUserName", "recipientUser", "recipient", "targetUser" };

    private object ArgAny(params string[] keys)
    {
        foreach (string k in keys)
            if (args.ContainsKey(k) && args[k] != null && args[k].ToString() != "") return args[k];
        return null;
    }

    public bool Execute()
    {
        // 1. Identify which trigger fired this action
        string triggerName = args.ContainsKey("triggerName") ? args["triggerName"].ToString() : "Unknown Event";
        bool isTest = args.ContainsKey("isTest") && args["isTest"].ToString().ToLower() == "true";
        string alertType = "generic";

        string eventSource = args.ContainsKey("eventSource") ? args["eventSource"].ToString().ToLower() : "";
        // Streamer.bot sets __source to the trigger, e.g. TwitchCheer, TwitchSub, TwitchReSub, TwitchGiftBomb.
        string source = args.ContainsKey("__source") && args["__source"] != null ? args["__source"].ToString() : "";
        string tNameLower0 = triggerName.ToLower();
        bool isTwitch = source.StartsWith("Twitch", StringComparison.OrdinalIgnoreCase)
                     || eventSource.Contains("twitch") || tNameLower0.Contains("twitch")
                     || tNameLower0.Contains("cheer") || tNameLower0.Contains("raid") || tNameLower0.Contains("follow");
        // Streamer.bot's own Test trigger has no platform: use the one saved by the Twitch import.
        if (isTest && !isTwitch && PlatformIsTwitch()) isTwitch = true;
        string platform = isTwitch ? "twitch" : "youtube";

        // Fix old YouTube terminology
        if (triggerName.IndexOf("New Sponsor", StringComparison.OrdinalIgnoreCase) >= 0)
        {
            triggerName = "New Member";
        }

        string tNameLower = triggerName.ToLower();

        // 2. Map Trigger Names to Overlay Alert Types
        if (isTwitch)
        {
            // Twitch reuses the YouTube alert slots: Sub->sub, ReSub->milestone, GiftBomb->gift,
            // GiftSub->giftRec, Bits (Cheer)->jewels. Follow and Raid are Twitch-only.
            string src = source.ToLower();
            if (src == "twitchcheer" || tNameLower.Contains("cheer") || tNameLower.Contains("bits")) alertType = "jewels";
            else if (src == "twitchraid" || tNameLower.Contains("raid")) alertType = "raid";
            else if (src == "twitchfollow" || tNameLower.Contains("follow")) alertType = "follow";
            else if (src == "twitchresub" || tNameLower.Contains("resub")) alertType = "milestone";
            else if (src == "twitchgiftbomb" || tNameLower.Contains("gift bomb") || tNameLower.Contains("community")) alertType = "gift";
            else if (src == "twitchgiftsub" || tNameLower.Contains("gift")) alertType = "giftRec";
            else if (src == "twitchsub" || tNameLower.Contains("sub")) alertType = "sub";
            // Titles come from the overlay's Platform setting, not from here.
        }
        else if (tNameLower.Contains("super chat")) alertType = "superchat";
        else if (tNameLower.Contains("super sticker")) alertType = "supersticker";
        else if (tNameLower.Contains("subscriber")) alertType = "sub";
        else if (tNameLower.Contains("milestone")) alertType = "milestone";
        else if (tNameLower.Contains("received")) alertType = "giftRec"; 
        else if (tNameLower.Contains("membership gift") || tNameLower.Contains("gift membership")) alertType = "gift";
        else if (tNameLower.Contains("member") || tNameLower.Contains("sponsor")) alertType = "member";
        else if (tNameLower.Contains("jewel")) alertType = "jewels";

        // Drop single GiftSubs that belong to a gift bomb (mirrors js/twitch-events.js) so a bomb doesn't flood.
        // NOTE: these arg names are guesses; confirm against real Streamer.bot args.
        if (isTwitch && alertType == "giftRec")
        {
            object bombObj = ArgAny("fromCommunitySubGift", "fromGiftBomb", "fromSubBomb", "fromCommunityGift");
            string bombStr = bombObj != null ? bombObj.ToString() : "";
            bool fromBomb;
            if (!bool.TryParse(bombStr, out fromBomb)) fromBomb = bombStr == "1";
            if (fromBomb)
            {
                CPH.LogInfo("[GTA-Alert] Skipping GiftSub that is part of a gift bomb.");
                return true;
            }
        }

        var payload = new Dictionary<string, object>
        {
            { "event", "GTA_Alert" },
            { "platform", platform },
            { "alertType", alertType },
            { "triggerName", triggerName }
        };

        // Standard User Variables (From Trigger Arguments)
        payload["userName"] = args.ContainsKey("user") ? args["user"].ToString() : 
                             (args.ContainsKey("userName") ? args["userName"].ToString() : (isTwitch ? "Twitch Viewer" : "YouTube Member"));
        
        string userProfileUrl = args.ContainsKey("userProfileUrl") ? args["userProfileUrl"].ToString() : "";
        
        // ALWAYS force valid test image if isTest == true
        if (isTest)
        {
            userProfileUrl = isTwitch
                ? "https://i.pravatar.cc/300?img=47"
                : "https://yt3.ggpht.com/XhCX8VaSQAaxcZhSahLCjdB19626R1VNRKKTbCd_PSlepkyqEJYGbybrAbiLHtSDwBN9KN72vYE=s600-c-k-c0x00ffffff-no-rj";
        }
        else if (isTwitch && string.IsNullOrEmpty(userProfileUrl))
        {
            try
            {
                object loginObj = (alertType == "giftRec")
                    ? ArgAny(RecipientArgs)
                    : ArgAny("userLogin", "userName", "user");
                string login = loginObj != null ? loginObj.ToString() : payload["userName"].ToString();
                var info = CPH.TwitchGetExtendedUserInfoByLogin(login);
                if (info != null) userProfileUrl = info.ProfileImageUrl ?? "";
            }
            catch (Exception ex) { CPH.LogWarn($"[GTA-Alert] Twitch avatar lookup failed: {ex.Message}"); }
        }
        else if (!isTwitch && !string.IsNullOrEmpty(userProfileUrl))
        {
            userProfileUrl = Regex.Replace(userProfileUrl, @"=s\d+-", "=s600-");
        }
        payload["userProfileUrl"] = userProfileUrl;

        // Anonymous Twitch gift bombs / cheers: show "Anonymous" instead of Twitch's placeholder account.
        if (isTwitch && (alertType == "gift" || alertType == "jewels") && IsAnonymous())
        {
            payload["userName"] = "Anonymous";
            payload["userProfileUrl"] = "";
        }

        // 3. Map Event-Specific Argument Data
        switch (alertType)
        {
            case "sub":
                payload["levelName"] = TwitchTier(ArgAny("tier", "subTier", "tierName"));
                break;

            case "follow":
                break;

            case "raid":
                payload["count"] = ArgAny("viewers", "viewerCount") ?? 0;
                break;

            case "member":
                payload["levelName"] = args.ContainsKey("tierName") ? args["tierName"] : "";
                break;
                
            case "milestone":
                payload["levelName"] = isTwitch ? TwitchTier(ArgAny("tier", "tierName")) : (ArgAny("tier", "tierName") ?? "");
                payload["months"] = ArgAny("cumulative", "months", "monthStreak") ?? 1;
                payload["message"] = args.ContainsKey("message") ? args["message"] : "";
                break;
                
            case "gift":
                string countStr = ArgAny("gifts", "totalGifts", "count", "amount")?.ToString() ?? "";
                if (isTest && string.IsNullOrEmpty(countStr)) countStr = "5";
                if (string.IsNullOrEmpty(countStr)) countStr = "1";
                payload["count"] = countStr;
                break;
                
            case "giftRec":
                if (isTwitch)
                {
                    // Prefer the display name (recipientUser); RecipientArgs (logins) are kept for the avatar lookup.
                    object recipient = ArgAny("recipientUser") ?? ArgAny(RecipientArgs);
                    if (recipient != null) payload["userName"] = recipient.ToString();
                    payload["gifterUser"] = (!IsAnonymous() && args.ContainsKey("user")) ? args["user"].ToString() : "Anonymous";
                    break;
                }
                if (args.ContainsKey("gifterUser") && !string.IsNullOrEmpty(args["gifterUser"].ToString()))
                {
                    payload["gifterUser"] = args["gifterUser"].ToString();
                }
                else if (args.ContainsKey("senderName") && !string.IsNullOrEmpty(args["senderName"].ToString()))
                {
                    payload["gifterUser"] = args["senderName"].ToString();
                }
                else if (args.ContainsKey("sender"))
                {
                    try 
                    {
                        var senderObj = JObject.FromObject(args["sender"]);
                        payload["gifterUser"] = senderObj["name"]?.ToString() ?? "Anonymous";
                    }
                    catch { payload["gifterUser"] = "Anonymous"; }
                }
                else
                {
                    payload["gifterUser"] = isTest ? "Test Gifter" : "Anonymous";
                }
                break;
                
            case "superchat":
                payload["amount"] = args.ContainsKey("amount") ? args["amount"] : "";
                payload["message"] = args.ContainsKey("message") ? args["message"] : "";
                break;
                
            case "supersticker":
                payload["amount"] = args.ContainsKey("amount") ? args["amount"] : "";
                payload["message"] = args.ContainsKey("message") ? args["message"] : "";
                
                string stickerUrl = args.ContainsKey("stickerUrl") ? args["stickerUrl"].ToString() : "";
                if (isTest) 
                {
                    stickerUrl = "https://www.gstatic.com/youtube/img/pdg/gift/assets/loot_box.webp";
                }
                payload["stickerImageUrl"] = stickerUrl;
                break;
                
            case "jewels":
                if (isTwitch)
                {
                    // Twitch Bits are the Jewels equivalent; the overlay labels them "Bits" when platform == twitch.
                    object bits = ArgAny("bits", "amount");
                    payload["jewelsAmount"] = bits ?? (isTest ? (object)500 : 0);
                    // Prefer the text with cheermotes ("Cheer100") removed when Streamer.bot provides it.
                    payload["message"] = ArgAny("messageCheermotesStripped", "messageStripped", "message", "rawInput") ?? "";
                    break;
                }
                payload["jewelsAmount"] = args.ContainsKey("gift.jewelsAmount") ? args["gift.jewelsAmount"] : "";
                payload["jewelsName"] = args.ContainsKey("gift.name") ? args["gift.name"] : "";
                
                string jewelsUrl = args.ContainsKey("gift.url") ? args["gift.url"].ToString() : "";
                if (isTest) 
                {
                    jewelsUrl = "https://www.gstatic.com/youtube/img/pdg/gift/assets/controller.webp";
                }
                payload["jewelsUrl"] = jewelsUrl;
                break;
        }

        // Twitch test runs: show a random follower of this channel instead of the stock picture.
        if (isTest && isTwitch && !"Anonymous".Equals(payload["userName"]))
        {
            string[] follower = RandomTwitchFollower();
            if (follower != null)
            {
                payload["userName"] = follower[0];
                if (!string.IsNullOrEmpty(follower[1])) payload["userProfileUrl"] = follower[1];
            }
        }

        // 4. Member emoji codes live in the message. YouTube emote images only exist on %emotes% / %parts%.
        if (payload.ContainsKey("message"))
        {
            payload["emotes"] = ReadJsonArg("emotes");
            payload["parts"] = ReadJsonArg("parts");
        }

        // Twitch events get their own overlay alert types (and their own Twitch Events rows in the setup page):
        // Sub -> twSub, ReSub -> twResub, GiftSub -> twGiftSub, GiftBomb -> twGiftBomb, Cheer -> twBits.
        // Follow and Raid keep their names. The payload fields above are unchanged.
        if (isTwitch)
        {
            string twType;
            if (TwitchAlertTypes.TryGetValue(alertType, out twType)) payload["alertType"] = twType;
        }

        // 5. Broadcast JSON via WebSockets
        string jsonPayload = JsonConvert.SerializeObject(payload);
        CPH.LogInfo($"[GTA-Alert] Broadcasting: {jsonPayload}");
        CPH.WebsocketBroadcastJson(jsonPayload);

        return true;
    }

    private static readonly Dictionary<string, string> TwitchAlertTypes = new Dictionary<string, string>
    {
        { "sub", "twSub" }, { "milestone", "twResub" }, { "giftRec", "twGiftSub" }, { "gift", "twGiftBomb" }, { "jewels", "twBits" }
    };

    private bool IsAnonymous()
    {
        object a = ArgAny("anonymous", "isAnonymous");
        bool b;
        return a != null && bool.TryParse(a.ToString(), out b) && b;
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

    // Streamer.bot Twitch tiers arrive as "tier 1" / "prime" (or EventSub "1000"); show "Tier 1" / "Prime".
    private string TwitchTier(object raw)
    {
        string s = raw?.ToString() ?? "";
        if (s.Length == 0) return "";
        string lower = s.ToLower();
        if (lower.Contains("prime")) return "Prime";
        Match m = Regex.Match(lower, @"^(\d)000$");
        if (!m.Success) m = Regex.Match(lower, @"(\d)");
        return m.Success ? m.Groups[1].Value : s; // the overlay row is already labelled "Tier"
    }

    private object ReadJsonArg(string key)
    {
        if (!args.ContainsKey(key) || args[key] == null) return new JArray();
        var raw = args[key];
        string text = raw as string;
        if (text == null && raw is JValue jv && jv.Type == JTokenType.String) text = jv.ToString();
        if (text != null)
        {
            text = text.Trim();
            if (text.Length == 0) return new JArray();
            if (text.StartsWith("[") || text.StartsWith("{"))
            {
                try { return JToken.Parse(text); }
                catch { return new JArray(); }
            }
            return new JArray();
        }
        return raw;
    }
}
