import ReactDOM from 'react-dom';

const EditProductModal = ({ productId, onClose, onProductUpdated }) => {
    return ReactDOM.createPortal(
        <div>
            <div
                className="modal-overlay"
                onClick={onClose}
                role="button"
                tabIndex={0}
                onKeyPress={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') onClose();
                }}
            ></div>
            <div className="modal">
                {/* Modal content here */}
                <h2>Edit Product</h2>
                <button onClick={onClose}>Close</button>
            </div>
        </div>,
        document.body // Render directly inside the body
    );
};

export default EditProductModal;
