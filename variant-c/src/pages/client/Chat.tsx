import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
 MessageSquare,
 Package,
 ChevronLeft,
 Loader2,
} from 'lucide-react';
import caseService from '../../services/case.service';
import { useAuthStore } from '../../store/authStore';
import { ChatWindow } from '../../components/chat/ChatWindow';

export default function ClientChat() {
 const { t } = useTranslation();
 const { user } = useAuthStore();
 const [cases, setCases] = useState<any[]>([]);
 const [loading, setLoading] = useState(true);
 const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);

 useEffect(() => {
 const loadCases = async () => {
 try {
 setLoading(true);
 const clientId = user?.clientId || user?.client?.id;
 if (!clientId) {
 setCases([]);
 return;
 }
 const data = await caseService.getCases({ clientId });
 // Only active cases (not delivered)
 const active = data.filter((c: any) => c.status !== 'delivered');
 setCases(active);
 if (active.length > 0 && !selectedCaseId) {
 setSelectedCaseId(active[0].id);
 }
 } catch (error) {
 console.error('Error loading cases for chat:', error);
 } finally {
 setLoading(false);
 }
 };

 loadCases();
 }, []);

 const selectedCase = cases.find((c) => c.id === selectedCaseId);

 if (loading) {
 return (
 <div className="flex items-center justify-center min-h-[400px]">
 <div className="text-center">
 <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
 <p className="text-gray-500">{t('common.loading')}</p>
 </div>
 </div>
 );
 }

 if (cases.length === 0) {
 return (
 <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
 <div className="w-16 h-16 bg-gray-100 flex items-center justify-center">
 <MessageSquare size={28} className="text-gray-400" />
 </div>
 <p className="text-gray-500 font-medium">{t('chat.noActiveCases')}</p>
 <p className="text-sm text-gray-400">Non ci sono casi aperti per chattare</p>
 <Link
 to="/portal/new-case"
 className="px-4 py-2 bg-gray-800 text-white font-semibold text-sm hover:bg-gray-700 transition-all"
 >
 {t('portal.submitNewCase')}
 </Link>
 </div>
 );
 }

 return (
 <div className="h-[calc(100vh-120px)] md:h-[calc(100vh-140px)] flex flex-col md:flex-row gap-4 -mx-2 px-2 md:mx-0 md:px-0">
 {/* Case List - Sidebar */}
 <div
 className={`md:w-72 lg:w-80 flex-shrink-0 flex flex-col gap-2 overflow-y-auto no-scrollbar ${
 selectedCaseId ? 'hidden md:flex' : 'flex'
 }`}
 >
 <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-1 px-1">
 {t('chat.openCases')}
 </h2>
 {cases.map((c) => (
 <button
 key={c.id}
 onClick={() => setSelectedCaseId(c.id)}
 className={`text-left w-full p-3 transition-all duration-200 flex items-center gap-3 border ${
 selectedCaseId === c.id
 ? ' text-white border-slate-700'
 : 'bg-white hover:bg-gray-50 border-gray-100'
 }`}
 >
 <div
 className={`w-10 h-10 flex items-center justify-center shrink-0 ${
 selectedCaseId === c.id
 ? 'bg-white/20'
 : 'bg-gray-50 text-blue-600'
 }`}
 >
 <Package size={18} />
 </div>
 <div className="min-w-0">
 <p
 className={`text-sm font-semibold truncate ${
 selectedCaseId === c.id ? 'text-white' : 'text-gray-800'
 }`}
 >
 {c.caseNumber}
 </p>
 <p
 className={`text-xs truncate ${
 selectedCaseId === c.id ? 'text-gray-300' : 'text-gray-500'
 }`}
 >
 {c.patientName || 'N/A'} · {c.teeth?.length || 0} {t('common.teeth')}
 </p>
 </div>
 </button>
 ))}
 </div>

 {/* Chat Area */}
 {selectedCase && (
 <div className="flex-1 flex flex-col min-w-0">
 {/* Mobile back button */}
 <div className="md:hidden flex items-center gap-2 mb-2">
 <button
 onClick={() => setSelectedCaseId(null)}
 className="w-8 h-8 bg-white border border-gray-200 flex items-center justify-center text-gray-600 "
 >
 <ChevronLeft size={18} />
 </button>
 <span className="text-sm font-semibold text-gray-700 truncate">
 {selectedCase.caseNumber} — {selectedCase.patientName || 'N/A'}
 </span>
 </div>
 <div className="flex-1 min-h-0">
 <ChatWindow
 caseId={selectedCase.id}
 caseName={`${selectedCase.caseNumber} — ${selectedCase.patientName || 'N/A'}`}
 />
 </div>
 </div>
 )}
 </div>
 );
}
