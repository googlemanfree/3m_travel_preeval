import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DOCUMENT_CATEGORIES, getCategoryById } from "@/data/documentCategories";

interface EditDocumentCategoryModalProps {
  isOpen: boolean;
  fileName: string;
  currentCategory: string;
  onClose: () => void;
  onSave: (newCategory: string) => void;
}

export function EditDocumentCategoryModal({
  isOpen,
  fileName,
  currentCategory,
  onClose,
  onSave,
}: EditDocumentCategoryModalProps) {
  const [selectedCategory, setSelectedCategory] = React.useState(currentCategory);

  React.useEffect(() => {
    setSelectedCategory(currentCategory);
  }, [currentCategory, isOpen]);

  const handleSave = () => {
    if (selectedCategory !== currentCategory) {
      onSave(selectedCategory);
    }
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-40"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-2xl z-50 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex items-center justify-between border-b border-blue-700">
              <div>
                <h2 className="text-xl font-bold text-white">Modifier la catégorie</h2>
                <p className="text-blue-100 text-sm mt-1 truncate">{fileName}</p>
              </div>
              <button
                onClick={onClose}
                className="text-white hover:bg-blue-700 p-2 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              <p className="text-gray-600 text-sm mb-4">
                Sélectionnez la nouvelle catégorie pour ce document :
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
                {DOCUMENT_CATEGORIES.map((category) => (
                  <motion.button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`p-4 rounded-lg border-2 transition text-left ${
                      selectedCategory === category.id
                        ? "border-blue-600 bg-blue-50"
                        : "border-gray-200 bg-white hover:border-blue-300"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{category.icon}</span>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{category.label}</p>
                        <p className="text-xs text-gray-600 mt-1">{category.description}</p>
                      </div>
                      {selectedCategory === category.id && (
                        <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0 mt-1" />
                      )}
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-gray-50 px-6 py-4 border-t border-gray-200 flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={onClose}
              >
                Annuler
              </Button>
              <Button
                onClick={handleSave}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Enregistrer
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
