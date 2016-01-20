# Usage example

```php
use CRMWebAPI\CRMWebAPI;

$api = new CRMWebAPI([
    'APIUrl' => 'https://test.crm.dynamics.com/api/data/v8.0/',
    'AccessToken' => '<your_token>'
]);

$id = $api->Create('accounts', ['name' => 'test-php']);
$uid = $api->Update('accounts', $id, ['name' => 'test-php-updated']);
$api->Delete('accounts', $uid->EntityId);
$whoami = $api->ExecuteFunction("WhoAmI");
```
