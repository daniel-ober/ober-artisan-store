import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { Link } from 'react-router-dom';
import './PreOrderPage.css';

const PreOrderPage = () => {
  const [preOrderItems, setPreOrderItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPreOrderItems = async () => {
      try {
        const preOrderQuery = query(
          collection(db, 'products'),
          where('isPreOrder', '==', true)
        );
        const querySnapshot = await getDocs(preOrderQuery);
        const items = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setPreOrderItems(items);
      } catch (error) {
        console.error('Error fetching pre-order items:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPreOrderItems();
  }, []);

  if (loading) {
    return <div className="loading">Loading Pre-Order Items...</div>;
  }

  return (
    <div className="pre-order-page">
      <h1>Pre-Order Your Handcrafted Drum</h1>
      <p className="subtitle">Limited quantities available. Reserve yours today!</p>
      <h2>BATCH #001</h2>

      <div className="pre-order-items">
        {preOrderItems.length > 0 &&
          preOrderItems.map((item) => (
            <div key={item.id} className="pre-order-item">
              <img src={item.imageUrl} alt={item.name} className="pre-order-image" />
              <div className="pre-order-info">
                <h2>{item.name}</h2>
                <p>{item.description}</p>
                <div className="price-container">
                  <p className="regular-price">Regular: ${item.regularPrice}</p>
                  <p className="promo-price">Early Access Promo: ${item.promoPrice}</p>
                </div>
                <Link to={`/products/${item.id}`}>
                  <button className="pre-order-button">Pre-Order Now</button>
                </Link>
              </div>
            </div>
          ))}

        {/* Sample Card: Oaked Ember Snare Drum */}
        <div className="pre-order-item">
          <img
            src="https://firebasestorage.googleapis.com/v0/b/danoberartisandrums-dev.firebasestorage.app/o/gallery%2F5c1ca018-b90f-4a1a-986e-bc8132c6dee9_handcrafteddrum2.jpeg?alt=media&token=cb8f1010-b444-4995-ae0e-f0959219e0e9"
            alt="Oaked Ember Snare Drum"
            className="pre-order-image"
          />
          <div className="pre-order-info">
            <h2>Scorched Oak</h2>
            <p>
            The Scorched Oak Series offers a traditional, dry sound with a focus on clarity and projection. Crafted from premium oak, these drums deliver a crisp attack and minimal overtones, perfect for drummers seeking a controlled, focused tone. The “scorched” finish adds a rugged, vintage aesthetic while enhancing durability. Ideal for players who appreciate a classic, powerful snare drum.            </p>
            <div className="price-container">
              <p className="regular-price">Starting at $749.99</p>
            </div>
            <button className="pre-order-button" onClick={() => alert('This is a sample pre-order.')}>
              Pre-Order Now
            </button>
          </div>
        </div>

                {/* Placeholder Card for Future Drums */}
                <div className="pre-order-item">
          <img
            src="https://firebasestorage.googleapis.com/v0/b/danoberartisandrums-dev.firebasestorage.app/o/products%2F9289980a-7082-47c5-9c60-47a9d6eb7bc2_IMG_6935.jpeg?alt=media&token=cfb836d5-b8ce-4b44-86f3-96e987131919"
            alt="Future Pre-Order Item"
            className="pre-order-image"
          />
          <div className="pre-order-info">
            <h2>Fused Walnut</h2>
            <p>
            The Fusion Series combines a stave inner shell with a steam-bent outer shell for a unique, versatile sound. Available in Maple/Walnut, Birch/Walnut, and Cherry/Walnut, these drums offer a range of tonal options, from bright and punchy to warm and deep. Designed for drummers seeking both projection and sustain, the Fusion Series delivers innovative performance with rich tone and stability.            </p>
            <div className="price-container">
              <p className="regular-price">Starting at $949.99</p>
            </div>
            <button className="pre-order-button" onClick={() => alert('This is a sample pre-order.')}>
              Pre-Order Now
            </button>
          </div>
        </div>

        {/* ARTiSAN True Experience Card */}
        <div className="pre-order-item">
          <img
            src="https://via.placeholder.com/300x200"
            alt="ARTiSAN True Experience"
            className="pre-order-image"
          />
          <div className="pre-order-info">
            <h2>PURE ARTiSAN Experience</h2>
            <p>
              Work directly with our master craftsmen to design your custom drum. Choose from a wide
              array of materials, finishes, and configurations to bring your dream drum to life.
            </p>
            <div className="price-container">
            </div>
            <Link to="/custom-shop">
              <button className="pre-order-button">Start Custom Order</button>
            </Link>
          </div>
        </div>
        <div>
        Stay tuned for our next handcrafted creation. Sign up to be the first to know about
              future releases!
            <button
              className="pre-order-button"
              onClick={() => alert('Sign up to be notified about future releases!')}
            >
              Notify Me
            </button>
        </div>
      </div>
    </div>
  );
};

export default PreOrderPage;
