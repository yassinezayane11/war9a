import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { toast } from 'react-toastify';
import api from '../../api';

function Portal({ children }) {
return ReactDOM.createPortal(children, document.body);
}

export default function AdminUsers() {
const [users, setUsers] = useState([]);
const [loading, setLoading] = useState(true);
const [search, setSearch] = useState('');
const [balanceModal, setBalanceModal] = useState(null);
const [balanceForm, setBalanceForm] = useState({ amount: '', action: 'add' });
const [balanceLoading, setBalanceLoading] = useState(false);

const fetchUsers = () => {
api.get('/admin/users')
.then(r => setUsers(r.data))
.catch(() => toast.error('Erreur'))
.finally(() => setLoading(false));
};

useEffect(() => { fetchUsers(); }, []);

// 🔥 BAN FUNCTION
const banUser = async (id) => {
try {
const { data } = await api.put(`/admin/ban/${id}`);
toast.success(data.msg || "User banned 🔒");
fetchUsers();
} catch {
toast.error("Erreur ban");
}
};

const toggleUser = async (id) => {
try {
const { data } = await api.patch(`/admin/users/${id}/toggle`);
setUsers(users.map(u => u._id === id ? data.user : u));
toast.success(data.message);
} catch {
toast.error('Erreur');
}
};

const handleBalanceSubmit = async (e) => {
e.preventDefault();
if (!balanceForm.amount || parseFloat(balanceForm.amount) <= 0) {
return toast.error('Montant invalide');
}


setBalanceLoading(true);
try {
  const { data } = await api.patch('/admin/users/balance', {
    userId: balanceModal._id,
    amount: parseFloat(balanceForm.amount),
    action: balanceForm.action
  });

  toast.success(data.message);

  setUsers(users.map(u =>
    u._id === balanceModal._id ? { ...u, balance: data.newBalance } : u
  ));

  setBalanceModal(null);
} catch (err) {
  toast.error(err.response?.data?.message || 'Erreur');
} finally {
  setBalanceLoading(false);
}


};

const filtered = users.filter(u =>
u.name?.toLowerCase().includes(search.toLowerCase()) ||
u.phone?.includes(search) ||
u.email?.toLowerCase().includes(search.toLowerCase())
);

return ( <div className="space-y-6 animate-fadeInUp">


  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
    <div>
      <h1 className="font-display text-3xl text-white tracking-wider">UTILISATEURS</h1>
      <p className="text-gray-500">{users.length} compte(s)</p>
    </div>
    <input
      className="input w-full sm:w-64"
      placeholder="🔍 Rechercher..."
      value={search}
      onChange={e => setSearch(e.target.value)}
    />
  </div>

  {loading ? (
    <div className="flex justify-center py-16">
      <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  ) : (
    <>

      {/* MOBILE */}
      <div className="md:hidden space-y-3">
        {filtered.map(u => (
          <div key={u._id} className="card space-y-3">

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-dark-600 rounded-xl flex items-center justify-center font-bold text-brand-400">
                {u.name?.[0]?.toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="font-semibold text-white">{u.name}</div>
                <div className="text-xs text-gray-500 font-mono">+216 {u.phone}</div>
              </div>
              <div className="text-right">
                <div className="font-mono font-bold text-brand-400">
                  {(u.balance || 0).toFixed(2)}
                </div>
                <div className="text-xs text-gray-500">TND</div>
              </div>
            </div>

            <div className="flex gap-2 flex-wrap">

              <button
                onClick={() => {
                  setBalanceModal(u);
                  setBalanceForm({ amount: '', action: 'add' });
                }}
                className="text-xs px-3 py-1.5 rounded-lg bg-brand-500/10 text-brand-400 border border-brand-500/30"
              >
                💰 Solde
              </button>

              {u.role !== 'admin' && (
                <>
                  <button
                    onClick={() => toggleUser(u._id)}
                    className={`text-xs py-1.5 px-3 rounded-lg ${
                      u.isActive ? 'btn-danger' : 'btn-success'
                    }`}
                  >
                    {u.isActive ? 'Désactiver' : 'Activer'}
                  </button>

                  
                  <button
                    onClick={() => banUser(u._id)}
                    className="text-xs py-1.5 px-3 rounded-lg bg-red-600/20 text-red-400 border border-red-500/30"
                  >
                    🚫 Ban
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* DESKTOP */}
      <div className="hidden md:block card p-0 overflow-hidden">
        <div className="w-full overflow-x-auto">
          <table className="w-full">
            <thead className="bg-dark-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Utilisateur</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Téléphone</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-600">
              {filtered.map(u => (
                <tr key={u._id} className="hover:bg-dark-700/40 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-dark-600 rounded-xl flex items-center justify-center font-bold text-brand-400">
                        {u.name?.[0]?.toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-white truncate">{u.name}</div>
                        {u.email && <div className="text-xs text-gray-500 truncate">{u.email}</div>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-300 font-mono text-sm">+216 {u.phone}</td>

                  <td className="px-4 py-3">
                    {u.role !== 'admin' ? (
                      <div className="flex items-center justify-end gap-2 flex-wrap">
                        <button
                          onClick={() => toggleUser(u._id)}
                          className={`text-xs px-3 py-2 rounded-lg whitespace-nowrap ${
                            u.isActive ? 'btn-danger' : 'btn-success'
                          }`}
                        >
                          {u.isActive ? 'Désact.' : 'Activer'}
                        </button>

                        <button
                          onClick={() => banUser(u._id)}
                          className="text-xs px-3 py-2 rounded-lg whitespace-nowrap bg-red-600/20 text-red-400 border border-red-500/30 hover:bg-red-600/30 transition-colors"
                        >
                          Ban
                        </button>
                      </div>
                    ) : (
                      <div className="text-right text-xs text-gray-500">—</div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </>
  )}

</div>


);
}
