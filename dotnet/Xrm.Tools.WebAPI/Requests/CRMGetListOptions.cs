using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Xrm.Tools.WebAPI.Requests
{
    public class CRMGetListOptions
    {
        public string[] Select { get; set; }

        public string[] OrderBy { get; set; }

        public string Filter { get; set; }

        public string Apply { get; set; }
        public int Skip { get; set; }
        public int Top  { get; set; }
        public bool IncludeCount { get; set; }
        public bool FormattedValues { get; set; }

        public Guid SystemQuery { get; set; }

        public Guid UserQuery { get; set; }
        public string FetchXml { get; set; }

        public CRMExpandOptions[] Expand { get; set; }

        public bool TrackChanges { get; set; }

        public string TrackChangesLink { get; set; }


    }
}
