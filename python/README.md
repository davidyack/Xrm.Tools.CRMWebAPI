CRMWebAPI Python
================

## Installation

### From PyPI

`pip install crmwebapi` (future)

### From sources

`python setup.py install`

## Usage example

    from crmwebapi import CRMWebAPI

    api = CRMWebAPI({
        'AccessToken': 'token',
        'APIUrl': 'https://test.crm.dynamics.com/api/data/v8.0/'})
    id = api.create('accounts', {'name': 'testpy2'})
    ent = api.get('accounts', id)
    upid = api.update('accounts', id, {'name': 'testpy2up'})
    
    if id != upid['EntityId']:
        print('Something went wrong')

    api.delete('accounts', upid['EntityId'])
    print(api.execute_function('WhoAmI'))
