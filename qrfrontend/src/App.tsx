import { ShieldAlert } from 'lucide-react';

function App() {
  const handleContinue = () => {
    console.log('User enabled alerts');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 flex items-center justify-center p-4 overflow-hidden relative">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 bg-blue-200/30 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-32 right-10 w-80 h-80 bg-cyan-200/30 rounded-full blur-3xl animate-float-delayed" />
      </div>

      <div className="w-full max-w-md mx-auto relative z-10">
        <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl p-8 space-y-8 animate-fade-in">
          <div className="flex justify-center animate-slide-down">
            <div className="relative">
              <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-xl animate-pulse-slow" />
              <div className="relative bg-gradient-to-br from-blue-500 to-cyan-500 p-5 rounded-full animate-bounce-subtle">
                <ShieldAlert className="w-12 h-12 text-white" strokeWidth={2} />
              </div>
            </div>
          </div>

          <div className="text-center space-y-3 animate-slide-up">
            <h1 className="text-3xl font-bold text-slate-800 leading-tight">
              Emergency Alert Web App
            </h1>
            <p className="text-slate-600 text-lg">
              Stay protected with real-time safety notifications
            </p>
          </div>

          <div className="space-y-4 animate-slide-up-delayed">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-2 h-2 mt-2 bg-blue-500 rounded-full" />
              <p className="text-slate-700 leading-relaxed">
                Your location will be continuously tracked for timely alerts.
              </p>
            </div>

            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-2 h-2 mt-2 bg-blue-500 rounded-full" />
              <p className="text-slate-700 leading-relaxed">
                This web app will install automatically and run in the background.
              </p>
            </div>

            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-2 h-2 mt-2 bg-blue-500 rounded-full" />
              <p className="text-slate-700 leading-relaxed">
                Emergency notifications will appear when you enter protected zones.
              </p>
            </div>
          </div>

          <button
            onClick={handleContinue}
            className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold text-lg py-4 px-8 rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 animate-slide-up-button focus:outline-none focus:ring-4 focus:ring-blue-300"
          >
            Enable Alerts
          </button>

          <p className="text-center text-sm text-slate-500 leading-relaxed animate-fade-in-delayed">
            <span className="inline-block mr-1">🔒</span>
            Location used only for your safety and emergencies.
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;
