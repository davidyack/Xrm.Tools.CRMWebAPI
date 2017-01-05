using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Text;
using System.Threading.Tasks;

namespace Xrm.Tools.WebAPI.Requests
{
    public class CRMWebAPIConfig
    {
        public string APIUrl { get; set; }
        public string AccessToken { get; set; }
        public Guid CallerID { get; set; }
        public Func<string, Task<string>> GetAccessToken { get; set; }
        public NetworkCredential   NetworkCredential { get; set; }

        public CRMWebAPILoggingOptions Logging { get; set; }

    }
}
