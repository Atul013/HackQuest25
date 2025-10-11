import { ShieldAlert, Bell, Radio, History, Activity } from 'lucide-react';
import { useState, useEffect } from 'react';

interface Announcement {
  id: string;
  title: string;
  message: string;
  type: 'emergency' | 'warning' | 'info';
  timestamp: number;
  isRead: boolean;
}

function App() {
  const [step, setStep] = useState<'initial' | 'active'>('initial');
  const [activeTab, setActiveTab] = useState<'status' | 'live' | 'previous'>('status');
  const [liveAnnouncements, setLiveAnnouncements] = useState<Announcement[]>([]);
  const [previousAnnouncements, setPreviousAnnouncements] = useState<Announcement[]>([]);

  useEffect(() => {
    if (step === 'active') {
      setLiveAnnouncements([
        {
          id: '1',
          title: 'Emergency Drill',
          message: 'Emergency evacuation drill scheduled for 3:00 PM today.',
          type: 'warning',
          timestamp: Date.now() - 300000,
          isRead: false
        },
        {
          id: '2',
          title: 'Weather Alert',
          message: 'Heavy rain expected in the area.',
          type: 'info',
          timestamp: Date.now() - 600000,
          isRead: false
        }
      ]);
      
      setPreviousAnnouncements([
        {
          id: '3',
          title: 'Fire Safety Training Completed',
          message: 'Fire safety training session completed successfully.',
          type: 'info',
          timestamp: Date.now() - 86400000,
          isRead: true
        }
      ]);
    }
  }, [step]);

  const markAsRead = (id: string) => {
    setLiveAnnouncements(prev => 
      prev.map(ann => ann.id === id ? { ...ann, isRead: true } : ann)
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md mx-auto">
        <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl p-8 space-y-8">
          
          {step === 'initial' && (
            <>
              <div className="flex justify-center">
                <div className="bg-gradient-to-br from-blue-500 to-cyan-500 p-5 rounded-full">
                  <ShieldAlert className="w-12 h-12 text-white" strokeWidth={2} />
                </div>
              </div>

              <div className="text-center space-y-3">
                <h1 className="text-3xl font-bold text-slate-800">
                  Emergency Alert Web App
                </h1>
                <p className="text-slate-600 text-lg">
                  Stay protected with real-time safety notifications
                </p>
              </div>

              <button
                onClick={() => setStep('active')}
                className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold py-4 px-6 rounded-2xl shadow-lg transition-all duration-300"
              >
                Skip to Announcements Demo
              </button>
            </>
          )}

          {step === 'active' && (
            <>
              <div className="flex justify-center">
                <div className="bg-gradient-to-br from-green-500 to-emerald-500 p-5 rounded-full">
                  <Bell className="w-12 h-12 text-white" strokeWidth={2} />
                </div>
              </div>

              <div className="text-center space-y-3">
                <h1 className="text-3xl font-bold text-slate-800">
                  Emergency Alerts Active
                </h1>
                <p className="text-slate-600 text-lg">
                  You're now protected by our alert system
                </p>
              </div>

              <div className="flex bg-gray-100 rounded-lg p-1 space-x-1">
                <button
                  onClick={() => setActiveTab('status')}
                  className={`flex-1 flex items-center justify-center space-x-2 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'status' 
                      ? 'bg-white text-blue-600 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  <Activity className="w-4 h-4" />
                  <span>Status</span>
                </button>
                <button
                  onClick={() => setActiveTab('live')}
                  className={`flex-1 flex items-center justify-center space-x-2 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'live' 
                      ? 'bg-white text-red-600 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  <Radio className="w-4 h-4" />
                  <span>Live</span>
                  {liveAnnouncements.filter(a => !a.isRead).length > 0 && (
                    <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {liveAnnouncements.filter(a => !a.isRead).length}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('previous')}
                  className={`flex-1 flex items-center justify-center space-x-2 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'previous' 
                      ? 'bg-white text-gray-600 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  <History className="w-4 h-4" />
                  <span>Previous</span>
                </button>
              </div>

              <div className="space-y-4">
                {activeTab === 'status' && (
                  <div className="space-y-4">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full bg-green-500" />
                        <span className="font-semibold text-slate-800">System Active</span>
                      </div>
                      <p className="text-slate-600 text-sm mt-2">
                        Emergency alert system is running and monitoring.
                      </p>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center space-x-2 text-blue-800">
                        <Bell className="w-5 h-5" />
                        <span className="font-semibold">Background Monitoring</span>
                      </div>
                      <p className="text-blue-700 text-sm mt-2">
                        App checks for announcements every 30 seconds.
                      </p>
                    </div>
                  </div>
                )}

                {activeTab === 'live' && (
                  <div className="space-y-3">
                    {liveAnnouncements.length === 0 ? (
                      <div className="text-center py-8">
                        <Radio className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-500">No live announcements</p>
                      </div>
                    ) : (
                      liveAnnouncements.map((announcement) => (
                        <div
                          key={announcement.id}
                          className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                            !announcement.isRead 
                              ? 'bg-red-50 border-red-200 hover:bg-red-100' 
                              : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                          }`}
                          onClick={() => markAsRead(announcement.id)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                  announcement.type === 'emergency' 
                                    ? 'bg-red-100 text-red-800'
                                    : announcement.type === 'warning'
                                    ? 'bg-orange-100 text-orange-800'
                                    : 'bg-blue-100 text-blue-800'
                                }`}>
                                  {announcement.type.toUpperCase()}
                                </span>
                                {!announcement.isRead && (
                                  <div className="w-2 h-2 bg-red-500 rounded-full" />
                                )}
                              </div>
                              <h4 className="font-semibold text-slate-800 mt-2">
                                {announcement.title}
                              </h4>
                              <p className="text-slate-600 text-sm mt-1">
                                {announcement.message}
                              </p>
                              <p className="text-gray-400 text-xs mt-2">
                                {new Date(announcement.timestamp).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {activeTab === 'previous' && (
                  <div className="space-y-3">
                    {previousAnnouncements.length === 0 ? (
                      <div className="text-center py-8">
                        <History className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-500">No previous announcements</p>
                      </div>
                    ) : (
                      previousAnnouncements.map((announcement) => (
                        <div
                          key={announcement.id}
                          className="border bg-gray-50 border-gray-200 rounded-lg p-4"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                  announcement.type === 'emergency' 
                                    ? 'bg-red-100 text-red-800'
                                    : announcement.type === 'warning'
                                    ? 'bg-orange-100 text-orange-800'
                                    : 'bg-blue-100 text-blue-800'
                                }`}>
                                  {announcement.type.toUpperCase()}
                                </span>
                              </div>
                              <h4 className="font-semibold text-slate-800 mt-2">
                                {announcement.title}
                              </h4>
                              <p className="text-slate-600 text-sm mt-1">
                                {announcement.message}
                              </p>
                              <p className="text-gray-400 text-xs mt-2">
                                {new Date(announcement.timestamp).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </>
          )}

          <div className="text-center">
            <p className="text-xs text-slate-500">
              Emergency alert system - Your safety is our priority
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;