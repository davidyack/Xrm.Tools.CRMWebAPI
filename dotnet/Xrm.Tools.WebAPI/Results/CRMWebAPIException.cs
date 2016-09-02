using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;

namespace Xrm.Tools.WebAPI.Results
{
    public class CRMWebAPIException : HttpRequestException
    {
        public CRMWebAPIException(string message) : base(message)
        {

        }
        public string JSON { get; set; }
    }
}
