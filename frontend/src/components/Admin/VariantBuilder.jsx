import React from 'react';
import { Plus, Trash2, Upload, X } from 'lucide-react';
import { adminUploadAPI } from '../../utils/adminApi';
import { getImageUrl } from '../../utils/api';
import { useToast } from '../Toast/ToastContainer';
import './VariantBuilder.css';

export default function VariantBuilder({ inventory, setInventory }) {
    const { success, error: showError } = useToast();

    const handleAddColorGroup = () => {
        setInventory([
            ...(inventory || []),
            {
                id: `temp-${Date.now()}`,
                colorName: '',
                images: [],
                sizes: [{ size: '', stock: 0 }]
            }
        ]);
    };

    const handleRemoveColorGroup = (groupIndex) => {
        setInventory(inventory.filter((_, idx) => idx !== groupIndex));
    };

    const handleColorNameChange = (groupIndex, newName) => {
        const newInventory = [...inventory];
        newInventory[groupIndex].colorName = newName;
        setInventory(newInventory);
    };

    const handleAddSize = (groupIndex) => {
        const newInventory = [...inventory];
        if (!newInventory[groupIndex].sizes) newInventory[groupIndex].sizes = [];
        newInventory[groupIndex].sizes.push({ size: '', stock: 0 });
        setInventory(newInventory);
    };

    const handleRemoveSize = (groupIndex, sizeIndex) => {
        const newInventory = [...inventory];
        newInventory[groupIndex].sizes = newInventory[groupIndex].sizes.filter((_, idx) => idx !== sizeIndex);
        setInventory(newInventory);
    };

    const handleSizeChange = (groupIndex, sizeIndex, field, value) => {
        const newInventory = [...inventory];
        newInventory[groupIndex].sizes[sizeIndex][field] = value;
        setInventory(newInventory);
    };

    const handleImageUpload = async (e, groupIndex) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        try {
            const result = await adminUploadAPI.uploadImages(files);
            if (result && result.images && result.images.length > 0) {
                const newInventory = [...inventory];
                newInventory[groupIndex].images = [...(newInventory[groupIndex].images || []), ...result.images];
                setInventory(newInventory);
                success(`${result.images.length} image(s) uploaded successfully`);
            }
        } catch (err) {
            showError(err.message || 'Failed to upload image');
        } finally {
            e.target.value = '';
        }
    };

    const handleRemoveImage = (groupIndex, imageIndex) => {
        const newInventory = [...inventory];
        newInventory[groupIndex].images = newInventory[groupIndex].images.filter((_, idx) => idx !== imageIndex);
        setInventory(newInventory);
    };

    if (!inventory || inventory.length === 0) {
        return (
            <div className="variant-empty-state">
                <p>No inventory variants configured. Add a color group to start managing complex stock, or you can use a blank group for simple products.</p>
                <button type="button" className="btn btn-outline" onClick={handleAddColorGroup}>
                    <Plus size={16} /> Add First Variant
                </button>
            </div>
        );
    }

    return (
        <div className="variant-builder">
            {inventory.map((group, groupIndex) => (
                <div key={group.id || groupIndex} className="variant-card">
                    <div className="variant-card-header">
                        <div className="form-group" style={{ marginBottom: 0, flex: 1 }}>
                            <label>Color Name (Leave empty if no color)</label>
                            <input
                                type="text"
                                placeholder="e.g. Crimson Red"
                                value={group.colorName || ''}
                                onChange={(e) => handleColorNameChange(groupIndex, e.target.value)}
                            />
                        </div>
                        <button
                            type="button"
                            className="btn btn-icon danger"
                            onClick={() => handleRemoveColorGroup(groupIndex)}
                            title="Remove Color Group"
                        >
                            <Trash2 size={18} />
                        </button>
                    </div>

                    <div className="variant-images-section">
                        <div className="variant-images-grid">
                            {(group.images || []).map((img, imgIdx) => (
                                <div key={imgIdx} className="variant-image-preview">
                                    <img src={getImageUrl(img)} alt={`Variant ${group.colorName || groupIndex} img ${imgIdx}`} />
                                    <button type="button" onClick={() => handleRemoveImage(groupIndex, imgIdx)}>
                                        <X size={14} />
                                    </button>
                                </div>
                            ))}
                            <label className="variant-upload-btn">
                                <input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    onChange={(e) => handleImageUpload(e, groupIndex)}
                                    style={{ display: 'none' }}
                                />
                                <Upload size={20} />
                            </label>
                        </div>
                    </div>

                    <div className="variant-sizes-section">
                        <div className="sizes-header">
                            <label>Sizes & Stock</label>
                        </div>
                        {(group.sizes || []).map((sizeObj, sizeIndex) => (
                            <div key={sizeIndex} className="size-row">
                                <div className="form-group" style={{ marginBottom: 0, flex: 1 }}>
                                    <input
                                        type="text"
                                        placeholder="Size (e.g. M, XL) - Leave blank if N/A"
                                        value={sizeObj.size || ''}
                                        onChange={(e) => handleSizeChange(groupIndex, sizeIndex, 'size', e.target.value)}
                                    />
                                </div>
                                <div className="form-group" style={{ marginBottom: 0, width: '120px' }}>
                                    <input
                                        type="number"
                                        placeholder="Stock"
                                        min="0"
                                        value={sizeObj.stock === 0 ? 0 : (sizeObj.stock || '')}
                                        onChange={(e) => handleSizeChange(groupIndex, sizeIndex, 'stock', parseInt(e.target.value) || 0)}
                                    />
                                </div>
                                {group.sizes.length > 1 && (
                                    <button
                                        type="button"
                                        className="btn btn-icon"
                                        onClick={() => handleRemoveSize(groupIndex, sizeIndex)}
                                    >
                                        <X size={16} />
                                    </button>
                                )}
                            </div>
                        ))}
                        <button
                            type="button"
                            className="add-size-btn"
                            onClick={() => handleAddSize(groupIndex)}
                        >
                            <Plus size={14} /> Add Size to {group.colorName || 'this variant'}
                        </button>
                    </div>
                </div>
            ))}

            <button type="button" className="btn btn-outline full-width" onClick={handleAddColorGroup}>
                <Plus size={16} /> Add Another Color Variant
            </button>
        </div>
    );
}
