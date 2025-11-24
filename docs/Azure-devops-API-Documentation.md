# Azure DevOps API Integration

This document describes the Azure DevOps REST API integration implemented in the ArchBridge SyncFlow Server.

## Overview

The server provides integration with the Azure DevOps REST API, allowing you to:

- Authenticate and connect to your Azure DevOps organization using Personal Access Tokens (PAT)
- Manage multiple Azure DevOps configurations
- Test connections by listing projects

## Setup

### Prerequisites

1. An Azure DevOps account
2. A Personal Access Token (PAT) with appropriate permissions
3. Your Azure DevOps organization name

### Configuration Methods

As a connector, Azure DevOps credentials can be configured via API:

#### Via API (Recommended for Connectors)

Use the create configuration endpoint to configure credentials through the frontend:

```bash
POST /api/azure-devops/configurations
```

The connection is automatically tested during creation. See the [Create Configuration](#create-configuration) section below for details.

### Creating a Personal Access Token (PAT)

1. **Access User Settings:**
   - Sign in to your Azure DevOps account
   - Click on your user icon in the top-right corner
   - Select "Personal access tokens"

2. **Generate a New Token:**
   - Click on "New Token"
   - Provide a descriptive name for the token
   - Set the expiration date as per your security requirements
   - Under "Scopes," select the necessary permissions:
     - **Project and Team (Read)**: Required for connection testing
     - **Work Items (Read, write, & manage)**: If you need to access work items
     - **Project and Team (Read, write, & manage)**: If you need to access projects
     - **Token Administration (Read & manage)**: For token management
     - **Member Entitlement Management (Read)**: For user management
   - Click "Create" to generate the token

3. **Store the Token Securely:**
   - Copy the generated token immediately, as it will not be displayed again
   - Securely store the token in a password manager or a secure location

### Configuration Test Status

All configurations have a test status that tracks whether they've been tested and if the test passed:

- **isTested** (boolean): Whether the configuration has been tested
- **testPassed** (boolean): Whether the connection test passed
- **testError** (string | null): Error message if the test failed

**Important Rules:**

- Configurations can be created even if the test fails
- Only configurations with `testPassed: true` can be activated
- Configurations with `testPassed: false` can be updated or deleted, but cannot be activated or used
- You can retest a configuration using `GET /api/azure-devops/test-connection?configId=xxx` to update its test status

### Finding Your Configuration Values

1. **Token Name:**
   - The name you assigned when creating the PAT
   - Used for identification purposes

2. **Organization:**
   - Your Azure DevOps organization name
   - Found in your Azure DevOps URL: `https://dev.azure.com/{organization}`
   - Example: If your URL is `https://dev.azure.com/mycompany`, your organization is `mycompany`

3. **PAT Token:**
   - The actual Personal Access Token value
   - Generated when you create a new token
   - Only shown once, so save it securely

## API Endpoints

All Azure DevOps endpoints are prefixed with `/api/azure-devops`.

### Connection & Configuration Management

#### Create Configuration

Create a new Azure DevOps configuration. The connection is automatically tested during creation by listing projects. Configurations can be saved even if the test fails, but they cannot be activated until they pass the test.

**Endpoint:** `POST /api/azure-devops/configurations`

**Request Body:**

```json
{
  "name": "My Azure DevOps Configuration",  // Required - token name
  "organization": "mycompany",              // Required - Azure DevOps organization
  "patToken": "your_pat_token_here",       // Required - Personal Access Token
  "setActive": false                        // Optional, whether to set as active configuration (only if test passes)
}
```

**Response (Test Passed):**

```json
{
  "success": true,
  "message": "Configuration created and connection test passed",
  "data": {
    "configuration": {
      "id": "azdo-config-1234567890-abc123",
      "name": "My Azure DevOps Configuration",
      "organization": "mycompany",
      "isActive": false,
      "isTested": true,
      "testPassed": true,
      "testError": null,
      "createdAt": "2024-01-01T12:00:00.000Z"
    },
    "testResult": {
      "success": true,
      "projects": [
        {
          "id": "project-id-1",
          "name": "My Project",
          "description": "Project description",
          "state": "wellFormed"
        }
      ],
      "projectCount": 1,
      "timestamp": "2024-01-01T12:00:00.000Z"
    }
  }
}
```

**Response (Test Failed - Configuration Still Saved):**

```json
{
  "success": true,
  "message": "Configuration created but connection test failed",
  "data": {
    "configuration": {
      "id": "azdo-config-1234567890-abc123",
      "name": "My Azure DevOps Configuration",
      "organization": "mycompany",
      "isActive": false,
      "isTested": true,
      "testPassed": false,
      "testError": "HTTP 401: Unauthorized",
      "createdAt": "2024-01-01T12:00:00.000Z"
    },
    "testResult": {
      "success": false,
      "error": "HTTP 401: Unauthorized",
      "timestamp": "2024-01-01T12:00:00.000Z"
    }
  }
}
```

**Important Notes:**

- Configuration is always saved, even if the test fails
- If `setActive: true` is provided but the test fails, the configuration will NOT be set as active
- Configurations that haven't passed the test (`testPassed: false`) cannot be activated
- You can test and update the configuration later using the test endpoint

#### Test Connection with Saved Configuration

Test connection using a previously saved configuration and update its test status. The test queries the Azure DevOps projects API to verify the PAT token is valid and has access to the organization.

**Endpoint:** `GET /api/azure-devops/test-connection?configId=xxx`

**Query Parameters:**

- `configId` (optional): Configuration ID to test. If omitted, uses the active configuration.

**Response:**

```json
{
  "success": true,
  "message": "Azure DevOps API connection test passed",
  "data": {
    "projects": [
      {
        "id": "project-id-1",
        "name": "My Project",
        "description": "Project description",
        "state": "wellFormed"
      }
    ],
    "projectCount": 1,
    "timestamp": "2024-01-01T12:00:00.000Z"
  },
  "configuration": {
    "id": "azdo-config-1234567890-abc123",
    "name": "My Azure DevOps Configuration",
    "organization": "mycompany",
    "isActive": false,
    "isTested": true,
    "testPassed": true,
    "testError": null
  }
}
```

**Note:** This endpoint updates the configuration's test status (`isTested`, `testPassed`, `testError`) in the database.

#### List Configurations

Get all saved Azure DevOps configurations.

**Endpoint:** `GET /api/azure-devops/configurations`

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "azdo-config-1234567890-abc123",
      "name": "Production Azure DevOps",
      "organization": "mycompany",
      "isActive": true,
      "isTested": true,
      "testPassed": true,
      "testError": null,
      "createdAt": "2024-01-01T12:00:00.000Z",
      "updatedAt": "2024-01-01T12:00:00.000Z"
    },
    {
      "id": "azdo-config-0987654321-xyz789",
      "name": "Development Azure DevOps",
      "organization": "devcompany",
      "isActive": false,
      "isTested": true,
      "testPassed": false,
      "testError": "HTTP 401: Unauthorized",
      "createdAt": "2024-01-02T12:00:00.000Z",
      "updatedAt": "2024-01-02T12:00:00.000Z"
    }
  ],
  "count": 2
}
```

#### Get Active Configuration

Get the currently active configuration.

**Endpoint:** `GET /api/azure-devops/configurations/active`

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "azdo-config-1234567890-abc123",
    "name": "Production Azure DevOps",
    "organization": "mycompany",
    "isActive": true,
    "isTested": true,
    "testPassed": true,
    "testError": null,
    "createdAt": "2024-01-01T12:00:00.000Z",
    "updatedAt": "2024-01-01T12:00:00.000Z"
  }
}
```

#### Get Configuration by ID

Get a specific configuration by its ID.

**Endpoint:** `GET /api/azure-devops/configurations/:id`

**Response:** Same format as active configuration

#### Update Configuration

Update an existing configuration.

**Endpoint:** `PUT /api/azure-devops/configurations/:id`

**Request Body:**

```json
{
  "name": "Updated Configuration Name",  // Optional
  "organization": "newcompany",          // Optional
  "patToken": "new_token",               // Optional - if updated, test status will be reset
  "isActive": true                       // Optional, setting to true will deactivate others (only if test passed)
}
```

**Response:** Updated configuration object with test status fields

**Note:** If `patToken` is updated, the test status (`isTested`, `testPassed`, `testError`) will be reset. You'll need to test the configuration again before it can be activated.

#### Delete Configuration

Delete a saved configuration.

**Endpoint:** `DELETE /api/azure-devops/configurations/:id`

**Response:**

```json
{
  "success": true,
  "message": "Configuration deleted successfully"
}
```

#### Activate Configuration

Set a configuration as the active one (will deactivate all others). Only configurations that have passed the test can be activated.

**Endpoint:** `POST /api/azure-devops/configurations/:id/activate`

**Response:** Activated configuration object

**Error Response (if test not passed):**

```json
{
  "success": false,
  "error": "Configuration must pass the connection test before it can be activated"
}
```

**Note:**

- **Important:** Only configurations with `testPassed: true` can be activated. Attempting to activate an untested or failed configuration will result in an error.

---

## Error Handling

All endpoints return consistent error responses:

**Error Response Format:**

```json
{
  "success": false,
  "error": "Error message description"
}
```

**Common HTTP Status Codes:**

- `400` - Bad Request (missing required parameters)
- `401` - Unauthorized (invalid or expired PAT token)
- `404` - Not Found (resource doesn't exist)
- `409` - Conflict (duplicate configuration)
- `500` - Internal Server Error (server-side error)

**Example Error Response:**

```json
{
  "success": false,
  "error": "patToken is required and must be a non-empty string"
}
```

---

## Usage Examples

### Using cURL

```bash
# Create a configuration
curl -X POST "http://localhost:3000/api/azure-devops/configurations" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Azure DevOps Config",
    "organization": "mycompany",
    "patToken": "your_pat_token_here"
  }'

# Test a configuration
curl "http://localhost:3000/api/azure-devops/test-connection?configId=azdo-config-xxx"

# List all configurations
curl "http://localhost:3000/api/azure-devops/configurations"

# Get active configuration
curl "http://localhost:3000/api/azure-devops/configurations/active"

# Activate a configuration
curl -X POST "http://localhost:3000/api/azure-devops/configurations/azdo-config-xxx/activate"
```

### Using JavaScript/TypeScript

```typescript
// Create a configuration
const createResponse = await fetch('http://localhost:3000/api/azure-devops/configurations', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'My Azure DevOps Config',
    organization: 'mycompany',
    patToken: 'your_pat_token_here'
  })
});
const { data: config } = await createResponse.json();

// Test a configuration
const testResponse = await fetch(
  `http://localhost:3000/api/azure-devops/test-connection?configId=${config.configuration.id}`
);
const testResult = await testResponse.json();

// List all configurations
const listResponse = await fetch('http://localhost:3000/api/azure-devops/configurations');
const { data: configs } = await listResponse.json();

// Activate a configuration
const activateResponse = await fetch(
  `http://localhost:3000/api/azure-devops/configurations/${config.configuration.id}/activate`,
  { method: 'POST' }
);
const activated = await activateResponse.json();
```

### Using Axios

```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api/azure-devops',
});

// Create a configuration
const { data: config } = await api.post('/configurations', {
  name: 'My Azure DevOps Config',
  organization: 'mycompany',
  patToken: 'your_pat_token_here'
});

// Test a configuration
const { data: testResult } = await api.get('/test-connection', {
  params: { configId: config.data.configuration.id }
});

// List all configurations
const { data: configs } = await api.get('/configurations');

// Activate a configuration
const { data: activated } = await api.post(`/configurations/${config.data.configuration.id}/activate`);
```

---

## Implementation Details

### Authentication

Azure DevOps uses Personal Access Token (PAT) authentication with Basic authentication:

- **Format**: `Authorization: Basic {base64(':PAT_TOKEN')}`
- The PAT token is base64 encoded with a colon prefix (`:PAT_TOKEN`)
- Base URL: `https://dev.azure.com/{organization}`

### Connection Testing

The connection test queries the Azure DevOps projects API:

- **Endpoint**: `GET https://dev.azure.com/{organization}/_apis/projects?api-version=7.1`
- On success, returns a list of projects in the organization
- Updates the configuration's test status in the database

### Security Best Practices

- **Limit Permissions**: Assign only the necessary scopes to the PAT to adhere to the principle of least privilege
- **Set Expiration Dates**: Define an appropriate expiration date for the PAT to enhance security
- **Secure Storage**: PAT tokens are stored securely in Supabase and never exposed in API responses
- **Regular Rotation**: Periodically regenerate and update the PAT to maintain security

---

## Testing

### Test Configuration Management

1. Start the server:

   ```bash
   npm run dev
   ```

2. Create a configuration:

   ```bash
   curl -X POST http://localhost:3000/api/azure-devops/configurations \
     -H "Content-Type: application/json" \
     -d '{
       "name": "Test Configuration",
       "organization": "mycompany",
       "patToken": "your_pat_token_here"
     }'
   ```

3. Test an existing configuration:

   ```bash
   curl "http://localhost:3000/api/azure-devops/test-connection?configId=azdo-config-xxx"
   ```

4. List all configurations:

   ```bash
   curl "http://localhost:3000/api/azure-devops/configurations"
   ```

---

## Troubleshooting

### Common Issues

**401 Unauthorized Error:**

- Check that the PAT token is correct and hasn't expired
- Verify the token has the necessary permissions (at minimum, Project and Team Read)
- Ensure the organization name is correct

**404 Not Found:**

- Verify the configuration ID exists
- Check that the organization name matches your Azure DevOps organization

**Connection Test Fails:**

- Verify the PAT token is valid and not expired
- Check that the organization name is correct
- Ensure the token has "Project and Team (Read)" scope enabled
- Verify network connectivity to `dev.azure.com`
- Confirm you have access to at least one project in the organization

**Cannot Activate Configuration:**

- Ensure the configuration has passed the connection test (`testPassed: true`)
- Test the configuration again using the test endpoint
- Check the `testError` field for details about why the test failed

### Debug Mode

Enable debug logging by setting `NODE_ENV=development` in your `.env` file. This will log all Azure DevOps API requests to the console.

---

## References

- [Azure DevOps REST API Documentation](https://docs.microsoft.com/en-us/rest/api/azure/devops/)
- [Personal Access Tokens Documentation](https://docs.microsoft.com/en-us/azure/devops/organizations/accounts/use-personal-access-tokens-to-authenticate)
- [Projects API](https://docs.microsoft.com/en-us/rest/api/azure/devops/core/projects/list)

---

## Support

For issues or questions:

1. Check the troubleshooting section above
2. Review the Azure DevOps API documentation
3. Verify your PAT token permissions and expiration
4. Check server logs for detailed error messages
