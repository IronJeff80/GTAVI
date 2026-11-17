using System;
using System.Collections.Generic;
using Newtonsoft.Json;

public class CPHInline
{
    public bool Execute()
    {
        // userName is the lowercase login (used for lookups); user is the display name (shown on the card).
        // "[Settings] Save user Vars on First Words" runs first and reads a saved userName user variable,
        // which Twitch chatters don't have, so %userName% can arrive empty: fall back to userLogin, then user.
        string user = Arg("userName");
        if (string.IsNullOrWhiteSpace(user)) user = Arg("userLogin");
        if (string.IsNullOrWhiteSpace(user)) user = Arg("user");
        if (string.IsNullOrWhiteSpace(user)) { CPH.LogWarn("[GTA-WalkOnTwitch] No user name in the trigger arguments; skipping."); return false; }
        string displayName = args.ContainsKey("user") && !string.IsNullOrWhiteSpace(args["user"]?.ToString())
                    ? args["user"].ToString() : user;

        string eventName = args.ContainsKey("eventName") ? (args["eventName"]?.ToString() ?? "MemberWalkOn") : "MemberWalkOn";
        bool isTest = args.ContainsKey("isTest") && args["isTest"]?.ToString()?.ToLower() == "true";

        string avatarUrl = isTest ? "https://i.pravatar.cc/300?img=47" : "";
        if (!isTest)
        {
            try
            {
                var info = CPH.TwitchGetExtendedUserInfoByLogin(user);
                if (info != null) avatarUrl = info.ProfileImageUrl ?? "";
            }
            catch (Exception ex) { CPH.LogWarn($"[GTA-WalkOnTwitch] Avatar lookup failed: {ex.Message}"); }
        }

        string levelName = "Viewer";
        if (Flag("isSubscribed")) levelName = "Subscriber";
        if (Flag("isVip")) levelName = "VIP";
        if (Flag("isModerator")) levelName = "Moderator";
        if (Flag("isBroadcaster")) levelName = "Broadcaster";

        // Same fields as the YouTube walk-on ("GTA Walk on Card Data"): userId, userName, levelName,
        // months, memberSince, avatarUrl, loyaltyLevel. Missing values fall back to the card's stat defaults.
        string userId = args.ContainsKey("userId") ? (args["userId"]?.ToString() ?? "") : "";

        var payload = new Dictionary<string, object>
        {
            { "event", eventName },
            { "platform", "twitch" },
            { "userId", userId },
            { "userName", displayName },
            { "avatarUrl", avatarUrl },
            { "levelName", levelName }
        };

        try
        {
            int? months = CPH.GetTwitchUserVar<int?>(user, "months", true);
            if (months.HasValue) payload["months"] = months.Value;
        }
        catch (Exception exMonths) { CPH.LogWarn($"[GTA-WalkOnTwitch] Could not read months: {exMonths.Message}"); }

        try
        {
            string memberSince = CPH.GetTwitchUserVar<string>(user, "memberSince", true);
            if (!string.IsNullOrEmpty(memberSince)) payload["memberSince"] = memberSince;
            string loyaltyLevel = CPH.GetTwitchUserVar<string>(user, "loyaltyLevel", true);
            payload["loyaltyLevel"] = string.IsNullOrEmpty(loyaltyLevel) ? "1" : loyaltyLevel;
        }
        catch (Exception exVars) { CPH.LogWarn($"[GTA-WalkOnTwitch] Could not read user vars: {exVars.Message}"); }

        string json = JsonConvert.SerializeObject(payload);
        CPH.LogInfo($"[GTA-WalkOnTwitch] Broadcasting: {json}");
        CPH.WebsocketBroadcastJson(json);
        return true;
    }

    private string Arg(string key)
    {
        return args.ContainsKey(key) && args[key] != null ? args[key].ToString() : "";
    }

    private bool Flag(string key)
    {
        return args.ContainsKey(key) && args[key] != null && args[key].ToString().ToLower() == "true";
    }
}
