#!/bin/bash

# Ensure output directory exists
mkdir -p apps/docs
mkdir -p gen/openapi

echo "🚀 Generating OpenAPI specification from Protobuf..."
# Run buf generate from the proto directory to ensure relative imports work correctly
(cd proto && npx @bufbuild/buf generate --template ../buf.gen.yaml .)

# Check if openapi.swagger.json was generated (note the path relative to project root)
if [ ! -f "gen/openapi/openapi.swagger.json" ]; then
    echo "❌ Failed to generate openapi.swagger.json"
    exit 1
fi

echo "🎨 Copying specification and creating Scalar HTML at apps/docs/..."

# Copy the JSON file to apps/docs for external access and cleaner loading
cp gen/openapi/openapi.swagger.json apps/docs/openapi.json

# Create the HTML file using Scalar Web Component (referencing the JSON file)
cat <<EOF > apps/docs/index.html
<!doctype html>
<html lang="ko">
  <head>
    <title>HOTPAXEL API Reference</title>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      body {
        margin: 0;
      }
    </style>
  </head>
  <body>
    <!-- Scalar standard web component loading via data-url -->
    <script
      id="api-reference"
      data-url="./openapi.json"></script>
    <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
  </body>
</html>
EOF

echo "✅ Documentation generated successfully at apps/docs/index.html"
