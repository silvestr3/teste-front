
import './App.css';
import { Thread } from './components/thread';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RuntimeProvider } from './context/runtime-context';

function App() {
  const queryClient = new QueryClient()
  
  return (
    <QueryClientProvider client={queryClient}>
      <RuntimeProvider>
          <Thread />
      </RuntimeProvider>
    </QueryClientProvider>
  )
}

export default App



