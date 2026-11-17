using System;
using System.Text.RegularExpressions;
using Streamer.bot.Plugin.Interface.Enums;

// Runs in "[Settings] Save user Vars on First Words" (Twitch First Words).
//  1. Channel link: keeps the viewer's saved channelLink user variable (for example a custom link set with
//     the channel link command). Only when there is none, or it is a broken value like
//     "https://twitch.tv/%userName%", it saves https://twitch.tv/<login>.
//  2. Auto shoutout: viewers in the Streamer.bot user group "Auto Shoutouts" get GTA_Shoutouts run for them.
// Always returns true, so the rest of the action keeps running.
public class CPHInline
{
    private const string AutoShoutoutGroup = "Auto Shoutouts";
    private const string ShoutoutAction = "GTA_Shoutouts";

    // An unresolved Streamer.bot variable such as %userName%. Percent-encoding (%20, %C3%A9) is removed
    // first, so a custom link with encoded characters is not mistaken for one.
    private static readonly Regex PercentEscape = new Regex(@"%[0-9A-Fa-f]{2}");
    private static readonly Regex Placeholder = new Regex(@"%[A-Za-z_][A-Za-z0-9_.]*%");
    private static readonly Regex TwitchLogin = new Regex(@"^[a-z0-9_]{1,25}$");

    public bool Execute()
    {
        if (!Arg("userType").Equals("twitch", StringComparison.OrdinalIgnoreCase) && !Arg("eventSource").Equals("twitch", StringComparison.OrdinalIgnoreCase))
            return true;

        string userId = Arg("userId");
        string login = ResolveLogin(userId);
        if (string.IsNullOrEmpty(login))
        {
            CPH.LogWarn("[GTA-FirstWordsLink] No Twitch login in the trigger arguments; channel link not saved.");
            return true;
        }

        // 1. Channel link
        string saved = !string.IsNullOrEmpty(userId)
            ? CPH.GetTwitchUserVarById<string>(userId, "channelLink", true)
            : CPH.GetTwitchUserVar<string>(login, "channelLink", true);
        string link = saved;
        if (!IsUsableLink(saved))
        {
            link = "https://twitch.tv/" + login;
            if (!string.IsNullOrEmpty(userId)) CPH.SetTwitchUserVarById(userId, "channelLink", link, true);
            else CPH.SetTwitchUserVar(login, "channelLink", link, true);
            CPH.LogInfo($"[GTA-FirstWordsLink] Saved channel link for {login}: {link}" + (string.IsNullOrEmpty(saved) ? "" : $" (replaced \"{saved}\")"));
        }
        CPH.SetArgument("channelLink", link);

        // 2. Auto shoutout
        bool inGroup = !string.IsNullOrEmpty(userId)
            ? CPH.UserIdInGroup(userId, Platform.Twitch, AutoShoutoutGroup)
            : CPH.UserInGroup(login, Platform.Twitch, AutoShoutoutGroup);
        if (inGroup)
        {
            // GTA_Shoutouts reads the target from rawInput (on First Words that is the chat message).
            CPH.SetArgument("rawInput", login);
            CPH.SetArgument("userType", "twitch");
            CPH.LogInfo($"[GTA-FirstWordsLink] {login} is in \"{AutoShoutoutGroup}\": running {ShoutoutAction}.");
            if (!CPH.RunAction(ShoutoutAction, false))
                CPH.LogWarn($"[GTA-FirstWordsLink] Could not run {ShoutoutAction} (missing or disabled?).");
        }
        return true;
    }

    private static bool IsUsableLink(string link)
    {
        if (string.IsNullOrWhiteSpace(link)) return false;
        return !Placeholder.IsMatch(PercentEscape.Replace(link, ""));
    }

    // userName is the lowercase login. It can arrive empty on First Words, so fall back to userLogin, then
    // user (the display name, usable when it is just the login's capitalisation), then a Twitch lookup by id.
    private string ResolveLogin(string userId)
    {
        foreach (string key in new[] { "userName", "userLogin", "user" })
        {
            string v = Arg(key).Trim().TrimStart('@').ToLowerInvariant();
            if (TwitchLogin.IsMatch(v)) return v;
        }
        if (string.IsNullOrEmpty(userId)) return "";
        try
        {
            var info = CPH.TwitchGetExtendedUserInfoById(userId);
            string v = (info?.UserLogin ?? "").ToLowerInvariant();
            return TwitchLogin.IsMatch(v) ? v : "";
        }
        catch (Exception ex)
        {
            CPH.LogWarn($"[GTA-FirstWordsLink] Twitch lookup failed: {ex.Message}");
            return "";
        }
    }

    private string Arg(string key)
    {
        return args.ContainsKey(key) && args[key] != null ? args[key].ToString() : "";
    }
}
