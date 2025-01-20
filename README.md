# WAX Dev Testing Framework

## Description
A lightweight and extensive automated accessibility testing framework

As a part of the WallyAX ecosystem accessibility tools, this package helps run accessibility tests on components and can easily be part of existing unit or integration testing.

## Installation

Install the package using npm:

```sh
npm install @wally-ax/wax-dev
```

Or using yarn:

```sh
yarn add @wally-ax/wax-dev
```

## Usage

### Configuration

Create a configuration file named wax.config.js in the root directory of your project. The file should look like this:

```javascript
module.exports = {
rules: ["image-alt", "list"],
apiKey:  "YOUR_WALLY_DEVELOPER_API_KEY"
};
```

rules: An array of strings representing rule definitions. Available rules can be found [here]("https://kb.wallyax.com/docs/wax-dev/rules"). An empty array will include all rules.

apiKey: A string required for the wax-dev to work. You can get the api key from [WallyAX Account Portal](https://account.wallyax.com)

  

### Example Usage with Jest Testing Library in a React App

runWax function takes the rendered or pre-rendered html content and options as input.

runWaxUrl function takes the Website URL and options as input.  

For a ButtonList component:

```javascript
import { render } from '@testing-library/react';
import ButtonList from './ButtonList';
const runWax = require('@wally-ax/wax-dev');

describe('ButtonList AX Test', () => {
  test('should have no accessibility violations', async () => {
    const { container } = render(<ButtonList />);
    const ele = JSON.stringify(container.innerHTML);
    const violations = await runWax(ele, { rules: ["images-alt"] });
    expect(violations).toHaveLength(0);
  });
});
```

Note: the rule configuration at test level will be overridden by the global configuration in wax.config.js

### Results

The results will be an array of violations based on the config. Example:

```json
[
  {
    "description": "Ensures <img> elements have alternate text or a role of none or presentation",
    "element": "<img src=\"logo\">",
    "impact": "critical",
    "message": "Images must have alternate text"
  },
  {
    "description": "Ensures every form element has a label",
    "element": "<input type=\"text\">",
    "impact": "critical",
    "message": "Form elements must have labels"
  },
  {
    "description": "Ensures that lists are structured correctly",
    "element": "<ul><p>List item 2</p><li>List item ...</ul>",
    "impact": "serious",
    "message": "<ul> and <ol> must only directly contain <li>, <script> or <template> elements"
  }
]

```

### Example Usage with Cypress Testing Library in a React App

For a Button component:

Button.cy.js

```javascript
import runWax from '@wally-ax/wax-dev';
import waxConfig from './waxconfig';

let violations;

describe('Button Component Tests', () => {
  it('should have no accessibility violations', () => {
    cy.mount(<Button variant="ghost" size="large">Outline</Button>);
    cy.get('body').then(async ($body) => {
      const ele = $body.html();
      violations = await runWax(ele, waxConfig);
      expect(violations).to.have.lengthOf(0);
    });
  });
  
  it('write_file', () => {
    cy.writeFile('src/components/ui/tests/button_violation.json', violations);
  });
});
```

Create a waxConfig.js file:

```javascript
const waxConfig = {
  rules: [],
  apiKey: "API KEY"
};

export default waxConfig;

```

### Results

The results will be an array of violations based on the config. A **button_violation.json** file will be created and violations will be saved.

## Example usage for running URL audit

```javascript
import { runWaxUrl } from '@wally-ax/wax-dev';
import waxConfig from './waxconfig';

async function performWaxOperation(url, waxConfig) {
    try {
        const resultUrl = await runWaxUrl(url, waxConfig);
        console.log('resultUrl', resultUrl);
    } catch (error) {
        console.error('Error running Wax URL:', error);
    }
}
const url = 'http://example.com'; // Replace with your actual URL

performWaxOperation(url, waxConfig);

```

## Integrate Storybook with WAX Dev

Create a folder inside the **.storybook** folder.

Inside that folder, create a **register.js** and **panel.js** file.

####  register.js

```javascript
// .storybook/my-addon/register.js - location
import React from 'react';
import { addons, types } from '@storybook/addons';
import MyPanel from './panel';

const ADDON_ID = 'my-addon';
const PANEL_ID = `${ADDON_ID}/panel`;

addons.register(ADDON_ID, () => {
  addons.add(PANEL_ID, {
    type: types.PANEL,
    title: 'WAX Accessibility Issues',
    render: ({ active, key }) => <MyPanel active={active} key={key} />,
  });
});
```
#### panel.js

```javascript
import React, { useEffect, useState } from 'react';
import { AddonPanel } from '@storybook/components';
import { useParameter } from '@storybook/api';
import { addons } from '@storybook/addons';
import Icon from '@mdi/react';
import { mdiChevronRight } from '@mdi/js';

const ADDON_ID = 'my-addon';
const PANEL_ID = `${ADDON_ID}/panel`;

const MyPanel = ({ active }) => {
  const [violations, setViolations] = useState([]);
  const value = useParameter('myAddonParameter', 'Default information');
  const fetchDataPath = useParameter('fetchDataPath', null);

  useEffect(() => {
    if (fetchDataPath) {
      const fetchData = async () => {
        const response = await fetch(fetchDataPath);
        const result = await response.json();
        setViolations(result);
      };
      fetchData();
    }
  }, [fetchDataPath]);

  const groupedViolations = violations.reduce((acc, violation) => {
    const { description } = violation;
    if (!acc[description]) {
      acc[description] = [];
    }
    acc[description].push(violation);
    return acc;
  }, {});

  return (
    <AddonPanel active={active}>
      <div style={{ padding: '10px' }}>
        {Object.keys(groupedViolations)?.length > 0 ? (
          Object.keys(groupedViolations).map((description, index) => (
            <div key={index} style={{ marginBottom: '10px', border: '1px solid #ccc', borderRadius: '4px' }}>
              <button
                onClick={() => {
                  const content = document.getElementById(`group-${index}-content`);
                  if (content.style.display === 'none') {
                    content.style.display = 'block';
                  } else {
                    content.style.display = 'none';
                  }
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  width: '100%',
                  border: 'none',
                  padding: '10px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                }}
              >
                <Icon path={mdiChevronRight} size={1} />
                {description}
              </button>
              <div id={`group-${index}-content`} style={{ display: 'none', padding: '10px' }}>
                {groupedViolations[description].map((violation, idx) => (
                  <div key={idx} style={{ marginBottom: '10px' }}>
                    <p style={{ margin: '0 0 10px' }}>
                      <span style={{ fontWeight: 'bold', fontSize: '16px' }}>Violation {idx + 1}:</span>
                    </p>
                    <p style={{ margin: '0 0 10px' }}>
                      <span style={{ color: '#fff', backgroundColor: '#ff4400', borderRadius: '9999px', padding: '2px 6px' }}>
                        {violation.severity}
                      </span>
                    </p>
                    <p style={{ margin: '0 0 10px', fontSize: '14px' }}>
                      <span style={{ fontWeight: 'bold' }}>Message:</span> {violation.message}
                    </p>
                    <pre style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}>
                      {violation.element}
                    </pre>
                  </div>
                ))}
              </div>
            </div>
          ))
        ) : (
          <p style={{ textAlign: 'center', fontSize: '16px', fontWeight: 'bold' }}>
            No accessibility violations found.
          </p>
        )}
      </div>
    </AddonPanel>
  );
};

export default MyPanel;
```

Add parameters in the stories with the respective test result file name. For example, for the **Button component**:

```sh
parameters: {
  myAddonParameter: 'This is constant information for the Button component.',
  fetchDataPath: 'src/components/ui/tests/button_violation.json'
}
```

**Button.stories.jsx**

```javascript
import React from 'react';
import { Button } from '@/components/ui/button';

export default {
  title: 'Components/Button',
  component: Button,
  argTypes: {
    asChild: {
      control: 'boolean',
    },
  },
  parameters: {
    myAddonParameter: 'This is constant information for the Button component.',
    fetchDataPath: 'src/components/ui/tests/button_violation.json'
  },
};

const Template = (args) => <Button {...args}>Button</Button>;

export const Default = Template.bind({});
Default.args = {
  variant: 'default',
  size: 'medium',
};
```

Note: Run the test before starting the Storybook.

#### You will see the new panel named "Wax-Dev" with violations in storybook.

## License

Mozilla Public License Version 2.0 (see license.txt)

WAX Dev is licensed as Mozilla Public License Version 2.0 and the copyright is owned by Wally Solutions Pvt Ltd and Contributors.

By contributing to WAX Dev, you agree that your contributions will be licensed under its Mozilla Public License Version 2.0.