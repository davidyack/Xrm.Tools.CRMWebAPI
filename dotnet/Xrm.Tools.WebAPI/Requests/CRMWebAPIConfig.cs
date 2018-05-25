using System;
using System.Net;
using System.Threading.Tasks;

namespace Xrm.Tools.WebAPI.Requests
{
    public class CRMWebAPIConfig
    {
        public string APIUrl { get; set; }
        public string AccessToken { get; set; }
        public bool ResolveUnicodeNames { get; set; }
        public Guid CallerID { get; set; }
        public Func<string, Task<string>> GetAccessToken { get; set; }
        public NetworkCredential   NetworkCredential { get; set; }
        public CRMWebAPILoggingOptions Logging { get; set; }

    }
}
