using System;
using Newtonsoft.Json.Linq;

public class CPHInline
{
    public bool Execute()
    {
        string json = "{}";
        if (CPH.TryGetArg("emotesJson", out string raw) && !string.IsNullOrWhiteSpace(raw))
        {
            json = raw.Trim();
        }

        try
        {
            var token = JToken.Parse(json);
            if (token == null || token.Type != JTokenType.Object)
            {
                json = "{}";
            }
            else
            {
                json = token.ToString(Newtonsoft.Json.Formatting.None);
            }
        }
        catch
        {
            json = "{}";
        }

        CPH.SetGlobalVar("memberEmojiMap", json, true);
        return true;
    }
}
