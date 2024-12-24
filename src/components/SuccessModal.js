const SuccessModal = ({ productId }) => (
    <div className="success-modal">
      <h2>🎉 Product Created Successfully!</h2>
      <p>Your new product has been created.</p>
      <a href={`/admin`}>Manage and Activate Product</a>
    </div>
  );
  
  export default SuccessModal;
  