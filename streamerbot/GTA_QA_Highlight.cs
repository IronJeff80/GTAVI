using System;
using System.Text.RegularExpressions;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

public class CPHInline
{
    public bool Execute()
    {
        // 1. Grab user & message from Quick Action / Chat Message Trigger / Command
        string user = args.ContainsKey("userName") ? args["userName"].ToString()
                    : (args.ContainsKey("user") ? args["user"].ToString()
                    : (args.ContainsKey("targetUser") ? args["targetUser"].ToString() : "Viewer"));

        string msg = args.ContainsKey("message") ? args["message"].ToString()
                   : (args.ContainsKey("rawInput") ? args["rawInput"].ToString() : "");

        if (string.IsNullOrWhiteSpace(msg))
        {
            CPH.LogWarn("[GTA-QA] Message was empty, skipping highlight.");
            return false;
        }

        // 2. Resolve Avatar URL from Trigger Args or User Persisted Variables
        string avatar = "";
        if (args.ContainsKey("profileImageUrl") && !string.IsNullOrEmpty(args["profileImageUrl"].ToString()))
            avatar = args["profileImageUrl"].ToString();
        else if (args.ContainsKey("userProfileUrl") && !string.IsNullOrEmpty(args["userProfileUrl"].ToString()))
            avatar = args["userProfileUrl"].ToString();
        else if (args.ContainsKey("avatarUrl") && !string.IsNullOrEmpty(args["avatarUrl"].ToString()))
            avatar = args["avatarUrl"].ToString();

        // Twitch: chat, command or quick action from Twitch (__source TwitchChatMessage, commandSource/eventSource "twitch").
        string source = args.ContainsKey("__source") && args["__source"] != null ? args["__source"].ToString() : "";
        string origin = ((args.ContainsKey("commandSource") ? args["commandSource"]?.ToString() : "") + " "
                       + (args.ContainsKey("eventSource") ? args["eventSource"]?.ToString() : "")).ToLower();
        bool isTwitch = source.StartsWith("Twitch", StringComparison.OrdinalIgnoreCase) || origin.Contains("twitch");

        if (string.IsNullOrEmpty(avatar) && !isTwitch)
        {
            string userId = args.ContainsKey("userId") ? args["userId"].ToString() : "";
            if (!string.IsNullOrEmpty(userId))
            {
                avatar = CPH.GetYouTubeUserVarById<string>(userId, "avatarUrl", true)
                      ?? CPH.GetYouTubeUserVarById<string>(userId, "userProfileUrl", true);
            }
            if (string.IsNullOrEmpty(avatar))
            {
                avatar = CPH.GetYouTubeUserVar<string>(user, "avatarUrl", true)
                      ?? CPH.GetYouTubeUserVar<string>(user, "userProfileUrl", true);
            }
        }

        // Twitch avatar (Twitch messages only): userName is the Twitch login.
        if (string.IsNullOrEmpty(avatar) && isTwitch)
        {
            try
            {
                var info = CPH.TwitchGetExtendedUserInfoByLogin(user);
                if (info != null) avatar = info.ProfileImageUrl ?? "";
            }
            catch (Exception ex) { CPH.LogWarn($"[GTA-QA] Twitch avatar lookup failed: {ex.Message}"); }
        }

        // Upscale YouTube avatar to 600px
        if (!string.IsNullOrEmpty(avatar))
        {
            avatar = Regex.Replace(avatar, @"=s\d+-", "=s600-");
        }

        // YouTube emotes and Twemoji only have image URLs on %emotes% / %parts%.
        // The message text is just the codes (:name:), so the overlay cannot draw them without these.
        var qaData = new
        {
            @event = "GTA_QA",
            user = user.ToUpper(),
            msg = msg,
            avatar = avatar ?? "",
            timestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(),
            emotes = ReadJsonArg("emotes"),
            parts = ReadJsonArg("parts")
        };

        string jsonOutput = JsonConvert.SerializeObject(qaData);

        // Update Global Variable ('viChatHighlight') AND Broadcast via WebSocket
        CPH.SetGlobalVar("viChatHighlight", jsonOutput, true);
        CPH.WebsocketBroadcastJson(jsonOutput);
        CPH.LogInfo($"[GTA-QA] Highlighted message from {user}: {jsonOutput}");

        return true;
    }

    // Streamer.bot sometimes hands %emotes% / %parts% over as a JSON string, sometimes as a parsed array.
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
