
import 'https://unpkg.com/@shopify/polaris@4.20.1/styles.min.css';
import enTranslations from 'https://unpkg.com/@shopify/polaris@4.20.1/locales/en.json';
import {AppProvider, Button} from 'https://unpkg.com/@shopify/polaris@4.20.1';

/*ReactDOM.render(
  <h1>Hello, world!</h1>,
  document.getElementById('root')
);*/

const app = (
  <AppProvider i18n={enTranslations}>
   <Button onClick={() => alert('Button clicked!')}>Example button</Button>
 </AppProvider>
);

ReactDOM.render(app, document.getElementById('root'));
