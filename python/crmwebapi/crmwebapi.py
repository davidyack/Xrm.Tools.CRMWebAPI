#!/usr/bin/env python
from __future__ import division
from __future__ import print_function

import datetime

import requests

try:
    # python 3
    from urllib.parse import urlparse, urlunparse, urlencode
    from urllib.request import urlopen
    from urllib.request import __version__ as urllib_version
except ImportError:
    from urlparse import urlparse, urlunparse
    from urllib2 import urlopen
    from urllib import urlencode
    from urllib import __version__ as urllib_version

# from crmwebapi import (__version__, json)
import simplejson as json


class CRMWebAPIException(Exception):
    pass


def _date_reviver(dct):
    for k, v in dct.items():
        if isinstance(v, str) or isinstance(v, basestring):
            try:
                dct[k] = datetime.datetime.strptime(v, '%Y-%m-%dT%H:%M:%SZ')
            except:
                pass
    return dct


class CRMWebAPI(object):
    def __init__(self, config):
        self._config = config

    def _build_query_headers(self, query_options=None):
        headers = {}
        if query_options is not None:
            if 'FormattedValues' in query_options:
                headers['odata.include-annotations'] = 'OData.Community.Display.V1.FormattedValue'
            if 'IncludeAnnotations' in query_options:
                headers['odata.include-annotations'] = '*'
        return headers

    def _build_query_url(self, uri, query_options=None):
        fullurl = self._config['APIUrl'] + uri

        qs = []
        if query_options is not None:
            if 'Select' in query_options:
                qs.append('%s=%s' % ('$select', ','.join(query_options['Select'])))

            if 'OrderBy' in query_options:
                qs.append('%s=%s' % ('$orderby', ','.join(query_options['OrderBy'])))

            if 'Filter' in query_options:
                qs.append('%s=%s' % ('$filter', query_options['Filter']))

            if 'IncludeCount' in query_options:
                qs.append('%s=%s' % ('$count', 'true'))

            if 'Skip' in query_options and query_options['Skip'] > 0:
                qs.append('%s=%s' % ('$skip', query_options['Skip']))

            if 'Top' in query_options and query_options['Top'] > 0:
                qs.append('%s=%s' % ('$top', query_options['Top']))

            if 'SystemQuery' in query_options:
                qs.append('%s=%s' % ('savedQuery', query_options['SystemQuery']))

            if 'UserQuery' in query_options:
                qs.append('%s=%s' % ('userQuery', query_options['UserQuery']))

            if 'FetchXml' in query_options:
                qs.append('%s=%s' % ('fetchXml', urlencode(query_options['FetchXml'])))

            fullurl += "?" + '&'.join(qs)

        return fullurl

    def _get_http_request(self, method, url, data=None, headers=None):
        if headers is None:
            headers = {}
        headers['Accept'] = 'application/json'
        headers['OData-MaxVersion'] = '4.0'
        headers['OData-Version'] = '4.0'

        if 'callerId' in self._config:
            headers['MSCRMCallerID'] = self._config['callerId']

        if 'AccessToken' in self._config:
            headers['Authorization'] = "Bearer %s" % self._config['AccessToken']

        payload = None
        if method in ['POST', 'PATCH']:
            payload = json.dumps(data)
            headers['Content-Type'] = 'application/json'
            headers['Content-Length'] = len(payload)

        return requests.request(method, url, headers=headers, data=payload)

    def get_list(self, uri, query_options=None):
        url = self._build_query_url(uri, query_options)
        res = self._get_http_request("GET", url, headers=self._build_query_headers(query_options))
        data = json.loads(res.content.decode('utf-8'), object_hook=_date_reviver)
        if 200 <= res.status_code < 300:
            result =  {
                'List': data['value'],
                'Count': 0
            }

            if '@odata.nextLink' in data:
                while('@odata.nextLink' in data):
                    res = self._get_http_request("GET", data['@odata.nextLink'], headers=self._build_query_headers(query_options))
                    data = json.loads(res.content.decode('utf-8'), object_hook=_date_reviver)
                    if 200 <= res.status_code < 300:
                        result['List'] = result['List'] + data['value']

            return result
        else:
            raise CRMWebAPIException(data)

    def get(self, entity_collection, entity_id, query_options=None):
        url = self._build_query_url("%s(%s)" % (entity_collection, entity_id), query_options)
        res = self._get_http_request("GET", url, headers=self._build_query_headers(query_options))
        data = json.loads(res.content.decode('utf-8'), object_hook=_date_reviver)
        if 200 <= res.status_code < 300:
            return _date_reviver(data)
        else:
            raise CRMWebAPIException(data)

    def get_count(self, uri, query_options=None):
        url = self._build_query_url("%s/$count" % uri, query_options)
        res = self._get_http_request("GET", url, headers=self._build_query_headers(query_options))
        data = json.loads(res.content.decode('utf-8'))
        if 200 <= res.status_code < 300:
            return _date_reviver(data)
        else:
            raise CRMWebAPIException(data)

    def create(self, entity_collection, data):
        url = self._config['APIUrl'] + entity_collection
        res = self._get_http_request("POST", url, data)
        if 200 <= res.status_code < 300:
            return res.headers['OData-EntityId'].split('(')[1].replace(')', '')
        else:
            try:
                data = json.loads(res.content.decode('utf-8'))
                raise CRMWebAPIException(data)
            except:
                raise CRMWebAPIException(res.content.decode('utf-8'))

    def update(self, entity_collection, key, data, upsert=False):
        url = '%s%s(%s)' % (self._config['APIUrl'], entity_collection, key)
        headers = {}
        if upsert:
            headers['If-Match'] = '*'
        res = self._get_http_request("PATCH", url, data, headers)
        if 200 <= res.status_code < 300:
            return {
                'EntityId': res.headers['OData-EntityId'].split('(')[1].replace(')', '')
            }
        else:
            try:
                data = json.loads(res.content.decode('utf-8'))
                raise CRMWebAPIException(data)
            except:
                raise CRMWebAPIException(res.content.decode('utf-8'))

    def delete(self, entity_collection, entity_id):
        url = '%s%s(%s)' % (self._config['APIUrl'], entity_collection, entity_id)
        res = self._get_http_request("DELETE", url)
        if 200 <= res.status_code < 300:
            return True
        else:
            try:
                data = json.loads(res.content.decode('utf-8'))
                raise CRMWebAPIException(data)
            except:
                raise CRMWebAPIException(res.content.decode('utf-8'))

    def associate(self, from_entity_collection, from_entity_id, nav_property, to_entity_collection, to_entity_id):
        url = '%s%s(%s)/%s/$ref' % (self._config['APIUrl'], from_entity_collection, from_entity_id, nav_property)
        data = {'@odata.id': '%s%s(%s)' % (self._config['APIUrl'], to_entity_collection, to_entity_id)}
        res = self._get_http_request('POST', url, data)
        if 200 <= res.status_code < 300:
            return True
        else:
            try:
                data = json.loads(res.content.decode('utf-8'))
                raise CRMWebAPIException(data)
            except:
                raise CRMWebAPIException(res.content.decode('utf-8'))

    def delete_association(self, from_entity_collection, from_entity_id, nav_property, to_entity_collection, to_entity_id):
        url = '%s%s(%s)/%s/$ref?$id=%s%s(%s)' % (self._config['APIUrl'], from_entity_collection, from_entity_id, nav_property, self._config['APIUrl'], to_entity_collection, to_entity_id)
        res = self._get_http_request('DELETE', url)
        if 200 <= res.status_code < 300:
            return True
        else:
            try:
                data = json.loads(res.content.decode('utf-8'))
                raise CRMWebAPIException(data)
            except:
                raise CRMWebAPIException(res.content.decode('utf-8'))

    def execute_function(self, function_name, parameters=None, entity_collection=None, entity_id=None):
        paramvars = []
        paramvalues = []
        paramcount = 1

        if parameters is not None:
            for key, value in parameters.iteritems():
                paramvars.append("%s=@p%s" % (key, paramcount))
                if isinstance(value, str):
                    paramvalues.append("@p%s='%s'" % (paramcount, value))
                else:
                    paramvalues.append("@p%s=%s" % (paramcount, value))
                paramcount += 1

        if parameters is not None:
            url = '%s%s(%s)?%s' % (self._config['APIUrl'], function_name, ','.join(paramvars), '&'.join(paramvalues))
            if entity_collection is not None:
                url = '%s%s(%s%s(%s)?%s' % (
                self._config['APIUrl'], entity_collection, entity_id, function_name, ','.join(paramvars),
                '&'.join(paramvalues))
        else:
            url = '%s%s()' % (self._config['APIUrl'], function_name)
            if entity_collection is not None:
                url = '%s%s(%s%s())' % (self._config['APIUrl'], entity_collection, entity_id, function_name)

        res = self._get_http_request('GET', url)
        data = json.loads(res.content.decode('utf-8'))
        if 200 <= res.status_code < 300:
            return _date_reviver(data)
        else:
            raise CRMWebAPIException(data)

    def execute_action(self, action_name, data=None, entity_collection=None, entity_id=None):
        url = '%s%s' % (self._config['APIUrl'], action_name)
        if entity_collection is not None:
            url = '%s%s(%s)%s' % (self._config['APIUrl'], entity_collection, entity_id, action_name)

        res = self._get_http_request('POST', url, data)
        data = json.loads(res.content.decode('utf-8'))
        if 200 <= res.status_code < 300:
            return _date_reviver(data)
        else:
            raise CRMWebAPIException(data)