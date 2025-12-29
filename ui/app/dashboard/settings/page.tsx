'use client';

import { useState, useEffect } from 'react';
import { SettingsAPI } from '@/lib/api';
import Icon, { 
  faCog,
  faPlus,
  faEdit,
  faTrash,
  faCheck,
  faTimes,
  faEnvelope,
  faPhone,
  faCreditCard,
  faBell,
  faGlobe,
  faSearch,
} from '@/app/components/Icon';
import { toast } from '@/app/components/Toaster';
import { Button, SettingsSkeleton } from '@/app/components';
import Modal from '@/app/components/Modal';

const CATEGORIES = [
  { id: 'all', label: 'All Settings', icon: faCog },
  { id: 'email', label: 'Email', icon: faEnvelope },
  { id: 'sms', label: 'SMS', icon: faPhone },
  { id: 'payment', label: 'Payment', icon: faCreditCard },
  { id: 'notification', label: 'Notifications', icon: faBell },
  { id: 'general', label: 'General', icon: faGlobe },
];

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<any[]>([]);
  const [groupedSettings, setGroupedSettings] = useState<Record<string, any[]>>({});
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedSetting, setSelectedSetting] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    key: '',
    value: '',
    category: 'general',
    description: '',
    is_encrypted: false,
  });

  useEffect(() => {
    fetchSettings();
  }, [selectedCategory, searchTerm]);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (selectedCategory !== 'all') {
        params.category = selectedCategory;
      }
      if (searchTerm) {
        params.search = searchTerm;
      }
      const response = await SettingsAPI.getAll(params);
      setSettings(response.data || []);
      setGroupedSettings(response.grouped || {});
      setCategories(response.categories || []);
    } catch (error: any) {
      console.error('Failed to fetch settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setFormData({
      key: '',
      value: '',
      category: 'general',
      description: '',
      is_encrypted: false,
    });
    setSelectedSetting(null);
    setCreateModalOpen(true);
  };

  const handleEdit = (setting: any) => {
    setFormData({
      key: setting.key,
      value: setting.value,
      category: setting.category,
      description: setting.description || '',
      is_encrypted: setting.is_encrypted || false,
    });
    setSelectedSetting(setting);
    setEditModalOpen(true);
  };

  const handleDelete = (setting: any) => {
    setSelectedSetting(setting);
    setDeleteModalOpen(true);
  };

  const handleSaveCreate = async () => {
    if (!formData.key.trim() || !formData.value.trim()) {
      toast.error('Key and value are required');
      return;
    }

    setSaving(true);
    try {
      await SettingsAPI.create(formData);
      toast.success('Setting created successfully');
      setCreateModalOpen(false);
      fetchSettings();
    } catch (error: any) {
      console.error('Failed to create setting:', error);
      toast.error(error?.response?.data?.message || 'Failed to create setting');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedSetting) return;

    setSaving(true);
    try {
      await SettingsAPI.update(selectedSetting.key, {
        value: formData.value,
        category: formData.category,
        description: formData.description,
        is_encrypted: formData.is_encrypted,
      });
      toast.success('Setting updated successfully');
      setEditModalOpen(false);
      fetchSettings();
    } catch (error: any) {
      console.error('Failed to update setting:', error);
      toast.error(error?.response?.data?.message || 'Failed to update setting');
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedSetting) return;

    setSaving(true);
    try {
      await SettingsAPI.delete(selectedSetting.key);
      toast.success('Setting deleted successfully');
      setDeleteModalOpen(false);
      fetchSettings();
    } catch (error: any) {
      console.error('Failed to delete setting:', error);
      toast.error(error?.response?.data?.message || 'Failed to delete setting');
    } finally {
      setSaving(false);
    }
  };

  const filteredSettings = selectedCategory === 'all'
    ? settings
    : settings.filter(s => s.category === selectedCategory);

  const displaySettings = searchTerm
    ? filteredSettings.filter(s => 
        s.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.description && s.description.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    : filteredSettings;

  if (loading) {
    return <SettingsSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
          <p className="text-gray-600 mt-1">Manage platform-wide configuration</p>
        </div>
        <Button
          onClick={handleCreate}
          variant="primary"
          size="md"
          icon={faPlus}
        >
          Add Setting
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-sm p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Category Filter */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-sm text-sm font-medium transition-colors ${
                    selectedCategory === cat.id
                      ? 'bg-[#0b66c2] text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Icon icon={cat.icon} size="sm" />
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Search */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search
            </label>
            <div className="relative">
              <Icon
                icon={faSearch}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size="sm"
              />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-sm focus:outline-none focus:ring-1 focus:ring-[#0b66c2] focus:border-[#0b66c2] text-sm"
                placeholder="Search by key or description..."
              />
            </div>
          </div>
        </div>
      </div>

      {/* Settings List */}
      {displaySettings.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-sm p-12 text-center">
          <Icon icon={faCog} className="text-gray-400 mx-auto mb-4" size="2x" />
          <p className="text-gray-600">No settings found</p>
          {selectedCategory !== 'all' && (
            <p className="text-sm text-gray-500 mt-2">
              Try selecting a different category or create a new setting
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedSettings)
            .filter(([category]) => selectedCategory === 'all' || category === selectedCategory)
            .map(([category, categorySettings]) => (
              <div key={category} className="bg-white border border-gray-200 rounded-sm">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                  <h2 className="text-lg font-semibold text-gray-900 capitalize">{category}</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {categorySettings.length} setting{categorySettings.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="divide-y divide-gray-200">
                  {categorySettings
                    .filter(s => 
                      !searchTerm || 
                      s.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      (s.description && s.description.toLowerCase().includes(searchTerm.toLowerCase()))
                    )
                    .map((setting) => (
                    <div key={setting.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-sm font-semibold text-gray-900">{setting.key}</h3>
                            {setting.is_encrypted && (
                              <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs font-medium rounded">
                                Encrypted
                              </span>
                            )}
                          </div>
                          {setting.description && (
                            <p className="text-sm text-gray-600 mb-2">{setting.description}</p>
                          )}
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">Value:</span>
                            <code className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-800 font-mono">
                              {setting.is_encrypted ? '••••••••' : setting.value}
                            </code>
                          </div>
                          <p className="text-xs text-gray-400 mt-2">
                            Last updated: {new Date(setting.updated_at).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEdit(setting)}
                            className="p-2 text-gray-600 hover:text-[#0b66c2] hover:bg-[#0b66c2]/10 transition-colors rounded-sm"
                            title="Edit"
                          >
                            <Icon icon={faEdit} size="sm" />
                          </button>
                          <button
                            onClick={() => handleDelete(setting)}
                            className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors rounded-sm"
                            title="Delete"
                          >
                            <Icon icon={faTrash} size="sm" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Create Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create Setting"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Key <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.key}
              onChange={(e) => setFormData({ ...formData, key: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-sm focus:outline-none focus:ring-1 focus:ring-[#0b66c2] focus:border-[#0b66c2] text-sm"
              placeholder="e.g., email.smtp.host"
            />
            <p className="text-xs text-gray-500 mt-1">Use dot notation for nested keys</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Value <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.value}
              onChange={(e) => setFormData({ ...formData, value: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-sm focus:outline-none focus:ring-1 focus:ring-[#0b66c2] focus:border-[#0b66c2] text-sm"
              rows={3}
              placeholder="Enter value (JSON or plain string)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-sm focus:outline-none focus:ring-1 focus:ring-[#0b66c2] focus:border-[#0b66c2] text-sm"
            >
              {CATEGORIES.filter(c => c.id !== 'all').map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-sm focus:outline-none focus:ring-1 focus:ring-[#0b66c2] focus:border-[#0b66c2] text-sm"
              rows={2}
              placeholder="Optional description"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_encrypted"
              checked={formData.is_encrypted}
              onChange={(e) => setFormData({ ...formData, is_encrypted: e.target.checked })}
              className="w-4 h-4 text-[#0b66c2] border-gray-300 rounded focus:ring-[#0b66c2]"
            />
            <label htmlFor="is_encrypted" className="text-sm text-gray-700">
              Encrypt value (for sensitive data like API keys)
            </label>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-200">
            <Button
              onClick={() => setCreateModalOpen(false)}
              variant="secondary"
              size="sm"
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveCreate}
              variant="primary"
              size="sm"
              icon={faCheck}
              loading={saving}
            >
              Create
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Edit Setting"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Key
            </label>
            <input
              type="text"
              value={formData.key}
              disabled
              className="w-full px-3 py-2 border border-gray-200 rounded-sm bg-gray-50 text-sm text-gray-500"
            />
            <p className="text-xs text-gray-500 mt-1">Key cannot be changed</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Value <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.value}
              onChange={(e) => setFormData({ ...formData, value: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-sm focus:outline-none focus:ring-1 focus:ring-[#0b66c2] focus:border-[#0b66c2] text-sm"
              rows={3}
              placeholder="Enter value (JSON or plain string)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-sm focus:outline-none focus:ring-1 focus:ring-[#0b66c2] focus:border-[#0b66c2] text-sm"
            >
              {CATEGORIES.filter(c => c.id !== 'all').map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-sm focus:outline-none focus:ring-1 focus:ring-[#0b66c2] focus:border-[#0b66c2] text-sm"
              rows={2}
              placeholder="Optional description"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="edit_is_encrypted"
              checked={formData.is_encrypted}
              onChange={(e) => setFormData({ ...formData, is_encrypted: e.target.checked })}
              className="w-4 h-4 text-[#0b66c2] border-gray-300 rounded focus:ring-[#0b66c2]"
            />
            <label htmlFor="edit_is_encrypted" className="text-sm text-gray-700">
              Encrypt value (for sensitive data like API keys)
            </label>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-200">
            <Button
              onClick={() => setEditModalOpen(false)}
              variant="secondary"
              size="sm"
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveEdit}
              variant="primary"
              size="sm"
              icon={faCheck}
              loading={saving}
            >
              Save Changes
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Setting"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            Are you sure you want to delete the setting <strong>{selectedSetting?.key}</strong>?
          </p>
          <p className="text-sm text-gray-600">
            This action cannot be undone.
          </p>
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-200">
            <Button
              onClick={() => setDeleteModalOpen(false)}
              variant="secondary"
              size="sm"
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmDelete}
              variant="secondary"
              size="sm"
              icon={faTrash}
              loading={saving}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

