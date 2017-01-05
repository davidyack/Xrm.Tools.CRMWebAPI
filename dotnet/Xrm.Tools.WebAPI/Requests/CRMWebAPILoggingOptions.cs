using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Xrm.Tools.WebAPI.Requests
{
    public class CRMWebAPILoggingOptions
    {
        public Action<string, string, object> Logger { get; set; }
        public bool ODataUrl { get; set; }
    }
}
