import React, { useEffect, useState, useCallback } from 'react';

import { useAuth } from '../context/AuthContext';

import {

  collection,

  getDocs,

  updateDoc,

  doc,

  query,

  where,

} from 'firebase/firestore';

import { db } from '../firebaseConfig';

import ProductCard from './ProductCard';

import './Products.css';

function normalizeOptions(options) {

  if (!Array.isArray(options)) return options;

  return options.map((opt) => {

    if (opt?.type === 'color') {

      return { ...opt, name: 'Colors' };

    }

    if (opt?.type === 'size') {

      return { ...opt, name: 'Sizes' };

    }

    return opt;

  });

}

const Products = ({ isMerchPage = false }) => {

  const { isAdmin } = useAuth();

  const [products, setProducts] = useState([]);

  const [loading, setLoading] = useState(true);

  const fetchProducts = useCallback(async () => {

    setLoading(true);

    try {

      const collectionName = isMerchPage ? 'merchProducts' : 'products';

      const ref = collection(db, collectionName);

      const q = query(ref, where('status', '==', 'active'));

      const snapshot = await getDocs(q);

      const items = snapshot.docs.map((d) => {

        const data = d.data() || {};

        const options = normalizeOptions(data.options);

        return {

          id: d.id,

          ...data,

          options,

          collection: collectionName,

        };

      });

      items.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

      setProducts(items);

    } catch (error) {

      console.error('❌ Error fetching products:', error);

    } finally {

      setLoading(false);

    }

  }, [isMerchPage]);

  useEffect(() => {

    fetchProducts();

  }, [fetchProducts]);

  const moveProduct = async (index, direction) => {

    const newIndex = index + direction;

    if (newIndex < 0 || newIndex >= products.length) return;

    const updated = [...products];

    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];

    updated.forEach((item, i) => {

      item.displayOrder = i;

    });

    setProducts(updated);

    try {

      await Promise.all(

        updated.map((item) =>

          updateDoc(

            doc(

              db,

              item.collection || (isMerchPage ? 'merchProducts' : 'products'),

              item.id

            ),

            { displayOrder: item.displayOrder }

          )

        )

      );

    } catch (error) {

      console.error('❌ Error updating product order:', error);

      fetchProducts();

    }

  };

  if (loading) {

    return (

      <div className="products-page">

        <div className="products-page-overlay" />

        <div className="products-shell">

          <div className="products-loading">

            Loading {isMerchPage ? 'Merch' : 'Products'}...

          </div>

        </div>

      </div>

    );

  }

  return (

    <div className="products-page">

      <div className="products-page-overlay" />

      <div className="products-shell">

        <section className="products-intro">

          <p className="products-kicker">

            {isMerchPage ? 'Merch' : 'Shop'}

          </p>

          <h1 className="products-page-title">

            {isMerchPage

              ? 'Studio layers, everyday wear, and Ober staples'

              : 'Explore the collection'}

          </h1>

          <p className="products-subtitle">

            {isMerchPage

              ? 'Apparel and goods designed to carry the Ober Artisan voice beyond the drum room.'

              : 'A curated selection of pieces from the Ober Artisan collection.'}

          </p>

        </section>

        {isAdmin && (

          <div className="products-admin-note">

            Admin mode enabled — use the arrows above each product to reorder

            display.

          </div>

        )}

        <div className={isAdmin ? 'admin-product-grid' : 'product-grid'}>

          {products.map((product, index) => (

            <div key={product.id} className="product-item">

              {isAdmin && (

                <div className="product-controls top">

                  <button

                    className="move-button left"

                    onClick={() => moveProduct(index, -1)}

                    aria-label="Move product left"

                    disabled={index === 0}

                  >

                    ←

                  </button>

                  <button

                    className="move-button right"

                    onClick={() => moveProduct(index, 1)}

                    aria-label="Move product right"

                    disabled={index === products.length - 1}

                  >

                    →

                  </button>

                </div>

              )}

              <ProductCard product={product} isAdmin={isAdmin} />

            </div>

          ))}

        </div>

      </div>

    </div>

  );

};

export default Products;