import Ches_s from './components/ches_s';
import './App.css';
import {  Routes, Route, Navigate} from 'react-router-dom'
function App() {
  let url = Date.now()
  return (
      <div className="App">
        <Routes>
          <Route  path={"/:id"} element={<Ches_s/>}></Route>
          <Route path = "/" element={<Navigate to={`/${url}`}></Navigate> }></Route>
        </Routes>
        
      </div>

  );
}

export default App;
