<?php

namespace CRMWebAPI;

require 'vendor/autoload.php';

use GuzzleHttp\Client;
use GuzzleHttp\Exception;

class CRMWebAPI {
    private $config;
    private $guzzleClient;

    function __construct($config)
    {
        $this->config = $config;

        $headers = [];
        $headers['Accept'] = 'application/json';
        $headers['OData-MaxVersion'] = '4.0';
        $headers['OData-Version'] = '4.0';
        if(isset($this->config['callerId'])) $headers['MSCRMCallerID'] = $this->config['callerId'];
        if(isset($this->config['AccessToken'])) $headers['Authorization'] = 'Bearer ' . $this->config['AccessToken'];

        $this->guzzleClient = new Client([
            'headers' => $headers,
        ]);
    }

    private function GetHttpRequest($method, $url, $data=null, $headers=null) {
        if ($headers == null) $headers = [];
        //$payload = null;
        if (in_array($method, ['POST', 'PATCH'])) {
            //$payload = json_encode($data);
            $headers['Content-Type'] = 'application/json';
            //$headers['Content-Length'] = strlen($payload);
        }

        return $this->guzzleClient->request($method, $url, [
            'headers' => $headers,
            'json' => $data
        ]);
    }

    private function BuildQueryURL($uri, $queryOptions=null) {
        $fullurl = $this->config['APIUrl'] . $uri;
        $qs = [];
        if ($queryOptions != null) {
            if(isset($queryOptions['Select'])) $qs['$select'] = implode(',', $queryOptions['Select']);
            if(isset($queryOptions['OrderBy'])) $qs['$orderby'] = implode(',', $queryOptions['OrderBy']);
            if(isset($queryOptions['Filter'])) $qs['$filter'] = $queryOptions['Filter'];
            if(isset($queryOptions['IncludeCount'])) $qs['$count'] = 'true';
            if(isset($queryOptions['Skip'])) $qs['$skip'] = $queryOptions['Skip'];
            if(isset($queryOptions['Top'])) $qs['$top'] = $queryOptions['Top'];
            if(isset($queryOptions['SystemQuery'])) $qs['savedQuery'] = $queryOptions['SystemQuery'];
            if(isset($queryOptions['UserQuery'])) $qs['userQuery'] = $queryOptions['UserQuery'];
            if(isset($queryOptions['FetchXml'])) $qs['fetchXml'] = $queryOptions['FetchXml'];
            $fullurl .= '?' . http_build_query($qs);
        }
        return $fullurl;
    }

    public function GetList($uri, $queryOptions=null) {
        $url = $this->BuildQueryURL($uri, $queryOptions);
        $res = $this->GetHttpRequest('GET', $url);

        if (($res->getStatusCode() >= 200) && ($res->getStatusCode() < 300)) {
            $data = json_decode($res->getBody());
            $result = new \stdClass();
            $result->List = $data->value;
            $result->Count = 0;
            return $result;
        } else {
            throw new \Exception($res->getBody(), $res->getStatusCode());
        }
    }

    public function Get($entityCollection, $entityId, $queryOptions=null) {
        $url = $this->BuildQueryURL(sprintf("%s(%s)", $entityCollection, $entityId), $queryOptions);
        $res = $this->GetHttpRequest('GET', $url);

        if (($res->getStatusCode() >= 200) && ($res->getStatusCode() < 300)) {
            $result = json_decode($res->getBody());
            return $result;
        } else {
            throw new \Exception($res->getBody(), $res->getStatusCode());
        }
    }

    public function GetCount($uri, $queryOptions=null){
        $url = $this->BuildQueryURL(sprintf("%s/$count", $uri), $queryOptions);
        $res = $this->GetHttpRequest('GET', $url);
        if (($res->getStatusCode() >= 200) && ($res->getStatusCode() < 300)) {
            $result = json_decode($res->getBody());
            return $result;
        } else {
            throw new \Exception($res->getBody(), $res->getStatusCode());
        }
    }

    public function Create($entityCollection, $data) {
        $url = sprintf('%s%s', $this->config['APIUrl'], $entityCollection);
        $res = $this->GetHttpRequest('POST', $url, $data);
        if (($res->getStatusCode() >= 200) && ($res->getStatusCode() < 300)) {
            $id = $res->getHeader('OData-EntityId')[0];
            $id = explode('(', $id)[1];
            $id = str_replace(')', '', $id);
            $result = $id;
            return $result;
        } else {
            throw new \Exception($res->getBody(), $res->getStatusCode());
        }
    }

    public function Update($entityCollection, $key, $data, $upsert=False) {
        $url = sprintf('%s%s(%s)', $this->config['APIUrl'], $entityCollection, $key);
        $headers = [];
        if($upsert) $headers['If-Match'] = '*';
        $res = $this->GetHttpRequest('PATCH', $url, $data, $headers);
        if (($res->getStatusCode() >= 200) && ($res->getStatusCode() < 300)) {
            $id = $res->getHeader('OData-EntityId')[0];
            $id = explode('(', $id)[1];
            $id = str_replace(')', '', $id);
            $result = new \stdClass();
            $result->EntityId = $id;
            return $result;
        } else {
            throw new \Exception($res->getBody(), $res->getStatusCode());
        }
    }

    public function Delete($entityCollection, $entityId) {
        $url = sprintf('%s%s(%s)', $this->config['APIUrl'], $entityCollection, $entityId);
        $res = $this->GetHttpRequest('DELETE', $url);
        if (($res->getStatusCode() >= 200) && ($res->getStatusCode() < 300)) {
            $result = True;
            return $result;
        } else {
            throw new \Exception($res->getBody(), $res->getStatusCode());
        }
    }

    public function ExecuteFunction($functionName, $parameters=null, $entityCollection=null, $entityId=null) {
        $paramvars = [];
        $paramvalues = [];
        $paramcount = 1;

        if($parameters != null) {
            foreach($parameters as $key => $value) {
                $paramvars[] = sprintf("%s=@p%s", $key, $paramcount);
                if(is_string($value)) {
                    $paramvalues[] = sprintf("@p%s='%s'", $paramcount, $value);
                } else {
                    $paramvalues[] = sprintf("@p%s=%s", $paramcount, $value);
                }
                $paramcount++;
            }
            $url = sprintf('%s%s(%s)?%s', $this->config['APIUrl'], $functionName, implode(',', $paramvars), implode('&', $paramvalues));
            if($entityCollection != null) {
                $url = sprintf('%s%s(%s%s(%s))?%s', $this->config['APIUrl'], $entityCollection, $entityId, $functionName, implode(',', $paramvars), implode('&', $paramvalues));
            }
        } else {
            $url = sprintf('%s%s()', $this->config['APIUrl'], $functionName);
            if($entityCollection != null) {
                $url = sprintf('%s%s(%s%s())', $this->config['APIUrl'], $entityCollection, $entityId, $functionName);
            }
        }

        $res = $this->GetHttpRequest('GET', $url);
        if (($res->getStatusCode() >= 200) && ($res->getStatusCode() < 300)) {
            $result = json_decode($res->getBody());
            return $result;
        } else {
            throw new \Exception($res->getBody(), $res->getStatusCode());
        }
    }

    public function ExecuteAction($actionName, $data=null, $entityCollection=null, $entityId=null) {
        $url = sprintf('%s%s', $this->config['APIUrl'], $actionName);
        if($entityCollection != null) {
            $url = sprintf('%s%s(%s)%s', $this->config['APIUrl'], $entityCollection, $entityId, $actionName);
        }

        $res = $this->GetHttpRequest('POST', $url, $data);
        if (($res->getStatusCode() >= 200) && ($res->getStatusCode() < 300)) {
            $result = json_decode($res->getBody());
            return $result;
        } else {
            throw new \Exception($res->getBody(), $res->getStatusCode());
        }
    }
}
