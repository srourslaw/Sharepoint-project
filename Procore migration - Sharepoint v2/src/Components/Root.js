import { Outlet } from 'react-router-dom';
import '../index.css';
import PropertyProvider from '../context/PropertyProvider';

const Root = () => {
  return (
    <PropertyProvider>
      <Outlet />
    </PropertyProvider>
  );
};

export default Root;
