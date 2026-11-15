using System;
using System.Text.RegularExpressions;
using Newtonsoft.Json;

public class CPHInline
{
    public bool Execute()
    {
        CPH.TryGetArg("userName", out string user);
        CPH.TryGetArg("userProfileUrl", out string avatar);

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
}
