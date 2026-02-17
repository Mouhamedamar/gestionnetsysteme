import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { DollarSign, ArrowLeft, Save, X, Upload, Image as ImageIcon } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { API_BASE_URL } from '../config';

const CreateExpense = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { expenses, addExpense, updateExpense, showNotification, fetchExpenses } = useApp();
  const isEditMode = !!id;
  
  const [expenseData, setExpenseData] = useState({
    title: '',
    description: '',
    category: 'AUTRE',
    amount: '',
    date: new Date().toISOString().slice(0, 16),
    status: 'NON_PAYE',
    supplier: '',
    receipt_number: '',
    justification_image: null
  });

  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isEditMode && expenses.length > 0) {
      const expense = expenses.find(e => e.id === parseInt(id));
      if (expense) {
        const expenseDate = expense.date ? new Date(expense.date).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16);
        setExpenseData({
          title: expense.title || '',
          description: expense.description || '',
          category: expense.category || 'AUTRE',
          amount: expense.amount || '',
          date: expenseDate,
          status: expense.status || 'NON_PAYE',
          supplier: expense.supplier || '',
          receipt_number: expense.receipt_number || '',
          justification_image: null
        });
        
        // Afficher l'image existante si disponible
        if (expense.justification_image || expense.justification_image_url) {
          const imageUrl = expense.justification_image_url || 
            (expense.justification_image?.startsWith('http') 
              ? expense.justification_image 
              : `${API_BASE_URL}${expense.justification_image}`);
          setImagePreview(imageUrl);
        }
      }
    }
  }, [id, isEditMode, expenses]);

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Vérifier le type de fichier
      if (!file.type.startsWith('image/')) {
        showNotification('Veuillez sélectionner une image', 'error');
        return;
      }

      // Vérifier la taille (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        showNotification('L\'image doit faire moins de 5MB', 'error');
        return;
      }

      setExpenseData(prev => ({
        ...prev,
        justification_image: file
      }));

      // Créer un preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setExpenseData(prev => ({
      ...prev,
      justification_image: null
    }));
    setImagePreview(null);
  };

  const handleSubmit = async () => {
    if (!expenseData.title || !expenseData.amount || parseFloat(expenseData.amount) <= 0) {
      showNotification('Veuillez remplir tous les champs obligatoires (Titre et Montant)', 'error');
      return;
    }

    try {
      setLoading(true);
      
      // Convertir la date au format ISO pour Django
      let expenseDate = expenseData.date;
      if (expenseDate) {
        try {
          const date = new Date(expenseDate);
          if (isNaN(date.getTime())) {
            throw new Error('Date invalide');
          }
          expenseDate = date.toISOString();
        } catch (e) {
          showNotification('Format de date invalide', 'error');
          setLoading(false);
          return;
        }
      } else {
        expenseDate = new Date().toISOString();
      }

      // Créer un FormData si une image est présente, sinon utiliser JSON
      const hasImage = expenseData.justification_image instanceof File;
      
      let dataToSend;
      if (hasImage) {
        // Utiliser FormData pour l'upload d'image
        dataToSend = new FormData();
        dataToSend.append('title', expenseData.title);
        dataToSend.append('description', expenseData.description || '');
        dataToSend.append('category', expenseData.category);
        // Convertir le montant en string pour FormData
        const amount = parseFloat(expenseData.amount);
        if (isNaN(amount) || amount <= 0) {
          showNotification('Le montant doit être un nombre positif', 'error');
          setLoading(false);
          return;
        }
        dataToSend.append('amount', amount.toString());
        dataToSend.append('date', expenseDate);
        dataToSend.append('status', expenseData.status);
        if (expenseData.supplier) {
          dataToSend.append('supplier', expenseData.supplier);
        }
        if (expenseData.receipt_number) {
          dataToSend.append('receipt_number', expenseData.receipt_number);
        }
        dataToSend.append('justification_image', expenseData.justification_image);
      } else {
        // Utiliser JSON si pas d'image
        const amount = parseFloat(expenseData.amount);
        if (isNaN(amount) || amount <= 0) {
          showNotification('Le montant doit être un nombre positif', 'error');
          setLoading(false);
          return;
        }
        dataToSend = {
          title: expenseData.title,
          description: expenseData.description || '',
          category: expenseData.category,
          amount: amount,
          date: expenseDate,
          status: expenseData.status,
          supplier: expenseData.supplier || '',
          receipt_number: expenseData.receipt_number || ''
        };
      }
      
      console.log('Données à envoyer:', {
        hasImage,
        isFormData: dataToSend instanceof FormData,
        data: dataToSend instanceof FormData ? 'FormData' : dataToSend
      });

      if (isEditMode) {
        await updateExpense(parseInt(id), dataToSend);
        showNotification('Dépense modifiée avec succès', 'success');
      } else {
        await addExpense(dataToSend);
        showNotification('Dépense créée avec succès', 'success');
      }
      
      navigate('/expenses');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      // L'erreur est déjà gérée dans addExpense/updateExpense
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="space-y-8 animate-fade-in pb-12">
        <PageHeader
          title={isEditMode ? 'Modifier la Dépense' : 'Nouvelle Dépense'}
          subtitle={isEditMode ? 'Modifier les informations de la dépense' : 'Créer une nouvelle dépense'}
          badge="Finance"
          icon={DollarSign}
        >
          <button
            onClick={() => navigate('/expenses')}
            className="px-4 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-semibold flex items-center gap-2 backdrop-blur-sm border border-white/20 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
            Retour aux dépenses
          </button>
        </PageHeader>

        {/* Expense Form */}
        <div className="glass-card p-6 border-white/40">
          <h2 className="text-xl font-bold text-slate-800 mb-6">Informations de la dépense</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-slate-800 mb-2">Titre *</label>
              <input
                type="text"
                value={expenseData.title}
                onChange={(e) => setExpenseData({...expenseData, title: e.target.value})}
                required
                placeholder="Ex: Achat de matériel informatique"
                className="w-full px-4 py-3 rounded-lg bg-white border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-slate-900 font-medium"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-800 mb-2">Catégorie *</label>
              <select
                value={expenseData.category}
                onChange={(e) => setExpenseData({...expenseData, category: e.target.value})}
                required
                className="w-full px-4 py-3 rounded-lg bg-white border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-slate-900 font-medium"
              >
                <option value="FOURNITURE">Fourniture</option>
                <option value="TRANSPORT">Transport</option>
                <option value="SALAIRE">Salaire</option>
                <option value="LOYER">Loyer</option>
                <option value="UTILITAIRE">Utilitaires</option>
                <option value="MARKETING">Marketing</option>
                <option value="MAINTENANCE">Maintenance</option>
                <option value="AUTRE">Autre</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-800 mb-2">Montant (FCFA) *</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={expenseData.amount}
                onChange={(e) => setExpenseData({...expenseData, amount: e.target.value})}
                required
                placeholder="0.00"
                className="w-full px-4 py-3 rounded-lg bg-white border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-slate-900 font-medium"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-800 mb-2">Date *</label>
              <input
                type="datetime-local"
                value={expenseData.date}
                onChange={(e) => setExpenseData({...expenseData, date: e.target.value})}
                required
                className="w-full px-4 py-3 rounded-lg bg-white border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-slate-900 font-medium"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-800 mb-2">Statut *</label>
              <select
                value={expenseData.status}
                onChange={(e) => setExpenseData({...expenseData, status: e.target.value})}
                required
                className="w-full px-4 py-3 rounded-lg bg-white border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-slate-900 font-medium"
              >
                <option value="NON_PAYE">Non payé</option>
                <option value="PAYE">Payé</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-800 mb-2">Fournisseur</label>
              <input
                type="text"
                value={expenseData.supplier}
                onChange={(e) => setExpenseData({...expenseData, supplier: e.target.value})}
                placeholder="Nom du fournisseur"
                className="w-full px-4 py-3 rounded-lg bg-white border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-slate-900 font-medium"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-800 mb-2">Numéro de reçu</label>
              <input
                type="text"
                value={expenseData.receipt_number}
                onChange={(e) => setExpenseData({...expenseData, receipt_number: e.target.value})}
                placeholder="Numéro de reçu ou facture"
                className="w-full px-4 py-3 rounded-lg bg-white border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-slate-900 font-medium"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-slate-800 mb-2">Description</label>
              <textarea
                value={expenseData.description}
                onChange={(e) => setExpenseData({...expenseData, description: e.target.value})}
                rows="4"
                placeholder="Description détaillée de la dépense..."
                className="w-full px-4 py-3 rounded-lg bg-white border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-slate-900 font-medium"
              />
            </div>

            {/* Upload d'image de justification */}
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-slate-800 mb-2">Image de justification</label>
              <div className="space-y-4">
                {imagePreview ? (
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Aperçu de la justification"
                      className="w-full max-w-md h-64 object-contain border-2 border-slate-300 rounded-lg bg-slate-50"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                      title="Supprimer l'image"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-slate-300 rounded-lg p-6 cursor-pointer hover:border-primary-500 transition flex flex-col items-center justify-center min-h-[200px] bg-slate-50">
                    <ImageIcon className="w-12 h-12 text-slate-400 mb-3" />
                    <p className="text-sm text-slate-600 text-center font-medium">
                      Cliquez pour sélectionner une image de justification
                    </p>
                    <p className="text-xs text-slate-400 mt-2">JPG, PNG (Max 5MB)</p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                )}
                {!imagePreview && (
                  <p className="text-xs text-slate-500 italic">
                    Facultatif : Ajoutez une photo du reçu, facture ou autre document justificatif
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <button
              onClick={() => navigate('/expenses')}
              className="btn-secondary py-3 px-6 font-bold shadow-lg shadow-slate-500/20 transition-all hover:shadow-xl flex items-center gap-2"
            >
              <X className="w-5 h-5" />
              Annuler
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || !expenseData.title || !expenseData.amount || parseFloat(expenseData.amount) <= 0}
              className={`py-3 px-6 font-bold shadow-lg transition-all hover:shadow-xl flex items-center gap-2 ${
                loading || !expenseData.title || !expenseData.amount || parseFloat(expenseData.amount) <= 0
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  : 'btn-primary shadow-primary-500/20'
              }`}
            >
              <Save className="w-5 h-5" />
              {loading ? 'Enregistrement...' : isEditMode ? 'Modifier la dépense' : 'Enregistrer la dépense'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default CreateExpense;
