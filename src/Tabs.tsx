import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';
import ExportApp from './ExportApp';
import ImportApp from './ImportApp';

export default () => (
    <Tabs>
        <TabList>
            <Tab>Экспорт</Tab>
            <Tab>Импорт</Tab>
        </TabList>

        <TabPanel>
            <ExportApp></ExportApp>
        </TabPanel>
        <TabPanel>
            <ImportApp></ImportApp>
        </TabPanel>
    </Tabs>
);