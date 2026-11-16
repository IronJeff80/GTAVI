using System;
using Streamer.bot.Plugin.Interface.Enums;

// Twitch First Words filter (GTA_First5 / GTA_WalkOnTwitch, Twitch import only).
// Sets %gtaSkip% = True when the chatter should not get First 5 or a walk-on card:
//   - the chatter is in the Streamer.bot user group "No First Words" (add your bots there), or
//   - the chatter is the broadcaster and OBS is streaming (you can still test your own chats while offline).
// The next sub-action is "If %gtaSkip% Equals True -> Break".
public class CPHInline
{
    private const string ExcludeGroup = "No First Words";

    public bool Execute()
    {
        bool skip = false;
        string reason = "";
        string userId = Arg("userId");
        string login = Arg("userName");
        if (string.IsNullOrWhiteSpace(login)) login = Arg("userLogin");
        if (string.IsNullOrWhiteSpace(login)) login = Arg("user");

        try
        {
            if (!string.IsNullOrEmpty(userId) && CPH.UserIdInGroup(userId, Platform.Twitch, ExcludeGroup)) { skip = true; reason = "in group " + ExcludeGroup; }
            else if (string.IsNullOrEmpty(userId) && !string.IsNullOrEmpty(login) && CPH.UserInGroup(login, Platform.Twitch, ExcludeGroup)) { skip = true; reason = "in group " + ExcludeGroup; }
        }
        catch (Exception ex) { CPH.LogWarn($"[GTA-FirstWords] Group check failed: {ex.Message}"); }

        if (!skip)
        {
            try
            {
                var me = CPH.TwitchGetBroadcaster();
                bool isBroadcaster = me != null && !string.IsNullOrEmpty(userId) && userId == me.UserId;
                if (isBroadcaster && CPH.ObsIsStreaming(0)) { skip = true; reason = "broadcaster while live"; }
            }
            catch (Exception ex) { CPH.LogWarn($"[GTA-FirstWords] Live check failed: {ex.Message}"); }
        }

        CPH.SetArgument("gtaSkip", skip);
        if (skip) CPH.LogInfo($"[GTA-FirstWords] Skipping {login}: {reason}.");
        return true;
    }

    private string Arg(string key)
    {
        return args.ContainsKey(key) && args[key] != null ? args[key].ToString() : "";
    }
}
