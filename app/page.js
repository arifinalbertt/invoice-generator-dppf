'use client';

import React, { useState, useRef } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export default function InvoiceForm() {
  const [showInvoice, setShowInvoice] = useState(false);
  const printRef = useRef(null);
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    invoiceNumber: '',
    date: new Date().toISOString().split('T')[0],
    items: [
      {
        description: '',
        quantity: '',
        unitPrice: '',
        discount: '',
        id: Date.now(),
      }
    ]
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setShowInvoice(true);
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, {
        description: '',
        quantity: '',
        unitPrice: '',
        discount: '',
        id: Date.now(),
      }]
    });
  };

  const removeItem = (id) => {
    if (formData.items.length > 1) {
      setFormData({
        ...formData,
        items: formData.items.filter(item => item.id !== id)
      });
    }
  };

  const updateItem = (id, field, value) => {
    setFormData({
      ...formData,
      items: formData.items.map(item => 
        item.id === id ? { ...item, [field]: value } : item
      )
    });
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('id-ID').format(value);
  };

  const calculateItemTotal = (item) => {
    const subtotal = Number(item.quantity) * Number(item.unitPrice);
    return subtotal;
  };

  const calculateGrandTotal = () => {
    return formData.items.reduce((sum, item) => sum + calculateItemTotal(item), 0);
  };

  const generatePDF = async () => {
    const element = printRef.current;
    if (!element) return;

    // Wait for images to load
    const images = element.getElementsByTagName('img');
    const imagePromises = Array.from(images).map(img => {
      if (img.complete) return Promise.resolve();
      return new Promise(resolve => {
        img.onload = resolve;
        img.onerror = resolve;
      });
    });
    
    await Promise.all(imagePromises);

    // Create canvas with better settings
    const canvas = await html2canvas(element, {
      scale: 2,
      logging: true,
      useCORS: true,
      allowTaint: true,
      imageTimeout: 0,
      onclone: (clonedDoc) => {
        const images = clonedDoc.getElementsByTagName('img');
        Array.from(images).forEach(img => {
          img.style.opacity = '1';
        });
      },
      backgroundColor: '#ffffff',
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight
    });

    const data = canvas.toDataURL("image/png", 1.0);
    
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "px",
      format: "a4",
      hotfixes: ["px_scaling"]
    });

    const imgProperties = pdf.getImageProperties(data);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProperties.height * pdfWidth) / imgProperties.width;

    pdf.addImage(data, "PNG", 0, 0, pdfWidth, pdfHeight, '', 'FAST');
    pdf.save(`Invoice-${formData.invoiceNumber}.pdf`);
  };

  if (showInvoice) {
    return (
      <div className="max-w-[794px] mx-auto p-6">
        <div className="flex justify-between mb-4">
          <button 
            onClick={() => setShowInvoice(false)}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-bold shadow-lg"
          >
            Back to Form
          </button>
          <button 
            onClick={generatePDF}
            className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 font-bold shadow-lg"
          >
            Generate PDF
          </button>
        </div>

        <div ref={printRef} className="bg-white p-8 rounded-lg shadow-lg" style={{ minHeight: '1123px' }}>
          <div className="flex justify-between items-start mb-12">
            <div className="w-40 h-40 mt-4">
              <div className="w-full h-full rounded-full bg-black overflow-hidden">
                <img 
                  src="/your_logo.png" 
                  alt="DIAMOND PPF INDONESIA"
                  className="w-full h-full object-cover p-1"
                  crossOrigin="anonymous"
                />
              </div>
            </div>
            <div>
              <h1 className="text-5xl font-bold mb-2 text-teal-400">INVOICE</h1>
              <div className="text-right space-y-1">
                <div className="text-lg text-black font-bold mb-1">Invoice No. {formData.invoiceNumber}</div>
                <div className="text-lg text-black font-bold mb-1">{formData.date}</div>
              </div>
            </div>
          </div>

          <div className="mb-12">
            <h2 className="text-xl font-bold mb-2 text-black">BILLED TO:</h2>
            <div className="text-lg font-medium text-black">{formData.customerName}</div>
            <div className="text-lg text-black">{formData.customerPhone}</div>
          </div>

          <table className="w-full mb-12">
            <thead>
              <tr className="border-b-2 border-gray-300">
                <th className="text-left py-3 text-lg text-black">Item</th>
                <th className="text-center py-3 text-lg text-black">Quantity</th>
                <th className="text-right py-3 text-lg text-black">Unit Price</th>
                <th className="text-right py-3 text-lg text-black">Total</th>
              </tr>
            </thead>
            <tbody>
              {formData.items.map((item) => (
                <tr key={item.id} className="border-b">
                  <td className="py-4 text-black">{item.description}</td>
                  <td className="py-4 text-center text-black">{item.quantity}</td>
                  <td className="py-4 text-right text-black">
                    {item.unitPrice ? formatCurrency(item.unitPrice) : ''}
                  </td>
                  <td className="py-4 text-right font-medium text-black">
                    {calculateItemTotal(item) ? formatCurrency(calculateItemTotal(item)) : ''}
                  </td>
                </tr>
              ))}
              {formData.items.some(item => item.discount) && (
                <tr className="border-b">
                  <td colSpan="3" className="py-4 text-black">Discount</td>
                  <td className="py-4 text-right text-black">
                    -{formatCurrency(formData.items.reduce((sum, item) => sum + Number(item.discount || 0), 0))}
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <div className="flex justify-between items-center mb-12">
            <div className="text-3xl text-black">Total</div>
            <div className="text-3xl font-bold text-blue-800">
              IDR {formatCurrency(calculateGrandTotal())}.00
            </div>
          </div>

          <div className="mb-12">
            <div className="text-2xl text-black">Thank You!</div>
          </div>

          <div className="bg-gray-100 p-6 rounded-lg">
            <h2 className="text-xl font-bold mb-3 text-red-700">PAYMENT INFORMATION</h2>
            <div className="text-lg text-black">BCA -  A.N. Jeffrey</div>
            <div className="text-lg font-medium text-black">3880908226</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="bg-white p-8 rounded-xl shadow-lg border-2 border-gray-200">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block font-bold mb-2 text-black">Customer Name:</label>
            <input
              type="text"
              required
              className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-black"
              value={formData.customerName}
              onChange={(e) => setFormData({...formData, customerName: e.target.value})}
            />
          </div>

          <div>
            <label className="block font-bold mb-2 text-black">Phone Number:</label>
            <input
              type="text"
              required
              className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-black"
              value={formData.customerPhone}
              onChange={(e) => setFormData({...formData, customerPhone: e.target.value})}
            />
          </div>

          <div>
            <label className="block font-bold mb-2 text-black">Date:</label>
            <input
              type="date"
              required
              className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-black"
              value={formData.date}
              onChange={(e) => setFormData({...formData, date: e.target.value})}
            />
          </div>

          <div>
            <label className="block font-bold mb-2 text-black">Invoice Number:</label>
            <input
              type="text"
              required
              className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-black"
              value={formData.invoiceNumber}
              onChange={(e) => setFormData({...formData, invoiceNumber: e.target.value})}
            />
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-black">Items</h3>
              <button
                type="button"
                onClick={addItem}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
              >
                Add Item
              </button>
            </div>

            {formData.items.map((item, index) => (
              <div key={item.id} className="p-4 border-2 border-gray-200 rounded-lg space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-black">Item {index + 1}</h4>
                  {formData.items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div>
                  <label className="block font-bold mb-2 text-black">Description:</label>
                  <input
                    type="text"
                    required
                    className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-black"
                    value={item.description}
                    onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block font-bold mb-2 text-black">Quantity:</label>
                    <input
                      type="number"
                      required
                      className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-black"
                      value={item.quantity}
                      onChange={(e) => updateItem(item.id, 'quantity', e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block font-bold mb-2 text-black">Unit Price:</label>
                    <input
                      type="number"
                      required
                      className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-black"
                      value={item.unitPrice}
                      onChange={(e) => updateItem(item.id, 'unitPrice', e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block font-bold mb-2 text-black">Discount Amount:</label>
                    <input
                      type="number"
                      className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-black"
                      value={item.discount}
                      onChange={(e) => updateItem(item.id, 'discount', e.target.value)}
                      placeholder="Optional"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button 
            type="submit" 
            className="w-full bg-blue-500 text-white py-3 px-4 rounded-lg hover:bg-blue-600 font-bold text-lg shadow-lg"
          >
            Preview Invoice
          </button>
        </form>
      </div>
    </div>
  );
}
