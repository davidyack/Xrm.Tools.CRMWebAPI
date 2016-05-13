using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Xrm.Tools.WebAPI.Requests
{
    public class CRMExpandOptions
    {
        public string Property { get; set; }

        public string[] Select { get; set; }

        public string[] OrderBy { get; set; }

        public string Filter { get; set; }       
        public int Top { get; set; }
    }
}
