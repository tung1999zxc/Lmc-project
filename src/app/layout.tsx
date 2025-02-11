"use client";
import { useState } from 'react'; // Import useState
import { Layout } from 'antd';
import SidebarMenu from './components/SidebarMenu';
import CurrentUserSelector from './components/CurrentUserSelector';
import { Provider } from 'react-redux';
import { store } from './store/store';
const { Header, Content, Sider } = Layout;

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <html lang="en">
      <body><Provider store={store}>
        <Layout style={{ minHeight: '100vh' }} >
          <Sider collapsible collapsed={collapsed} onCollapse={(value) => setCollapsed(value)} style={{paddingLeft: '-20px'}}>
            <div className="logo" style={{ color: 'white', textAlign: 'center', padding: '20px' }}>
            
            </div>
            <SidebarMenu />
          </Sider>
          <Layout>
            <Header style={{ background: '#fff', padding: 0, textAlign: 'center' }}>Header</Header><CurrentUserSelector/>
             <Content style={{ margin: '16px' }}>{children}</Content>
          </Layout>
        </Layout></Provider>
      </body>
    </html>
  );
};

export default DashboardLayout;