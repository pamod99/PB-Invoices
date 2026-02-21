import React, { useRef, useMemo } from 'react';
import { InvoiceData, InvoiceItem, AppSettings } from '../types';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Download, ArrowLeft, Printer } from 'lucide-react';

interface InvoicePreviewProps {
  data: InvoiceData;
  settings: AppSettings;
  onEdit: () => void;
}

export const InvoicePreview: React.FC<InvoicePreviewProps> = ({ data, settings, onEdit }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Helper to generate initials from business name
  const businessInitials = useMemo(() => {
    return settings.businessName
      .split(' ')
      .map(n => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  }, [settings.businessName]);

  // Pagination Logic
  const pages = useMemo(() => {
    const PAGE_HEIGHT_ESTIMATE = 1050; 
    const HEADER_HEIGHT = 200; 
    const FOOTER_HEIGHT = 140; 
    const ITEM_BASE_HEIGHT = 45; 
    
    // Reduced row height estimate for 5-column layout (smaller images)
    const ITEM_IMAGE_ROW_HEIGHT = 160; 

    const chunkedPages: InvoiceItem[][] = [];
    let currentPageItems: InvoiceItem[] = [];
    let currentHeight = HEADER_HEIGHT;

    data.items.forEach((item) => {
      // 5 columns grid calculation
      const imageRows = Math.ceil(item.images.length / 5); 
      const itemHeight = ITEM_BASE_HEIGHT + (imageRows * ITEM_IMAGE_ROW_HEIGHT);

      if (currentHeight + itemHeight > PAGE_HEIGHT_ESTIMATE) {
        chunkedPages.push(currentPageItems);
        currentPageItems = [];
        currentHeight = 80; 
      }

      currentPageItems.push(item);
      currentHeight += itemHeight;
    });

    if (currentPageItems.length > 0) {
      chunkedPages.push(currentPageItems);
    }
    
    if (currentHeight + FOOTER_HEIGHT > PAGE_HEIGHT_ESTIMATE) {
       chunkedPages.push([]); 
    }

    return chunkedPages;
  }, [data]);

  const handleDownloadPdf = async () => {
    if (!containerRef.current) return;

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageElements = containerRef.current.querySelectorAll('.invoice-page');

    for (let i = 0; i < pageElements.length; i++) {
      const pageEl = pageElements[i] as HTMLElement;
      
      pageEl.style.boxShadow = 'none';
      pageEl.style.marginBottom = '0';

      const canvas = await html2canvas(pageEl, {
        scale: 4, // Keep high scale for resolution
        backgroundColor: '#ffffff',
        useCORS: true,
        logging: false,
        allowTaint: true,
        imageTimeout: 0,
      });

      const imgData = canvas.toDataURL('image/png'); 
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      if (i > 0) pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

      pageEl.style.boxShadow = '';
      pageEl.style.marginBottom = '';
    }

    pdf.save(`Invoice_${data.invoiceNumber}.pdf`);
  };

  const subtotal = data.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const taxAmount = subtotal * (data.taxRate / 100);
  const total = subtotal + taxAmount - (data.discount || 0);

  return (
    <div className="flex-1 overflow-y-auto bg-gray-900 p-8 flex flex-col items-center">
      
      {/* Action Bar */}
      <div className="w-full max-w-[210mm] flex justify-between items-center mb-8 sticky top-0 bg-gray-900/90 backdrop-blur-sm py-4 z-20 border-b border-gray-800">
        <button 
          onClick={onEdit}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={20} />
          Back to Editor
        </button>
        <div className="flex gap-4">
           <button 
             onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-800 text-white hover:bg-gray-700 transition-colors border border-gray-700"
          >
            <Printer size={18} />
            Print
          </button>
          <button 
            onClick={handleDownloadPdf}
            className="flex items-center gap-2 px-6 py-2 rounded-lg bg-brand-gold text-brand-dark font-bold hover:bg-brand-goldHover transition-colors shadow-lg shadow-brand-gold/20"
          >
            <Download size={18} />
            Download PDF
          </button>
        </div>
      </div>

      {/* Pages Container */}
      <div ref={containerRef} className="space-y-8 pb-16">
        {pages.map((pageItems, pageIndex) => {
          const isFirstPage = pageIndex === 0;
          const isLastPage = pageIndex === pages.length - 1;

          return (
            <div 
              key={pageIndex}
              className="invoice-page w-[210mm] min-h-[297mm] bg-white text-gray-900 shadow-2xl relative flex flex-col justify-between"
            >
              <div>
                {/* Header Decoration */}
                {isFirstPage && (
                   <div className="absolute top-0 left-0 w-full h-2 bg-brand-navy border-b-2 border-brand-gold"></div>
                )}
                
                <div className="p-10 pt-12 pb-4">
                  
                  {/* Header (Only First Page) */}
                  {isFirstPage ? (
                    <>
                      {/* Compact Header */}
                      <div className="flex justify-between items-start mb-8">
                        <div className="space-y-1">
                          <h1 className="font-serif text-4xl font-bold text-brand-navy tracking-tight">INVOICE</h1>
                          <div className="flex items-center gap-2 text-gray-500 font-medium pt-1">
                             <span className="bg-gray-100 px-2 py-0.5 rounded text-xs">#{data.invoiceNumber}</span>
                             <span>•</span>
                             <span className="text-sm">{new Date(data.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                          </div>
                        </div>
                        
                        <div className="text-right flex flex-col items-end">
                           <div className="flex items-center gap-2 mb-2">
                              {/* Show Logo if available, otherwise show Initials Box */}
                              {settings.businessLogo ? (
                                <img src={settings.businessLogo} alt="Logo" className="h-16 w-auto object-contain" />
                              ) : (
                                <div className="w-8 h-8 bg-brand-navy text-brand-gold flex items-center justify-center font-serif font-bold text-md rounded">
                                  {businessInitials}
                                </div>
                              )}
                              
                              <div className="text-right">
                                <h3 className="font-serif text-xl font-bold text-brand-navy leading-none">{settings.businessName}</h3>
                              </div>
                           </div>
                           <div className="text-xs text-gray-600 whitespace-pre-wrap text-right mb-1">
                             {settings.businessAddress}
                           </div>
                           <p className="text-xs text-gray-600">{settings.contactEmail}</p>
                        </div>
                      </div>

                      {/* Compact Client & Payment Info Grid */}
                      <div className="grid grid-cols-2 gap-8 mb-8 border-t border-b border-gray-100 py-6">
                        <div>
                          <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-brand-gold"></span>
                            Bill To
                          </h4>
                          <div className="text-gray-800">
                            <p className="font-bold text-lg font-serif text-brand-navy">{data.client.company}</p>
                            <p className="font-medium text-sm">{data.client.name}</p>
                            <p className="text-xs text-gray-500 leading-relaxed mt-1">{data.client.address}</p>
                          </div>
                        </div>

                        <div>
                           <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                             <span className="w-1.5 h-1.5 rounded-full bg-brand-gold"></span>
                             Payment Info
                           </h4>
                           <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                               <span className="text-gray-500 text-xs">Bank</span>
                               <span className="font-bold text-gray-800 text-xs text-right">{data.bankDetails.bankName}</span>
                               
                               <span className="text-gray-500 text-xs">Acc Name</span>
                               <span className="font-bold text-gray-800 text-xs text-right truncate">{data.bankDetails.accountName}</span>
                               
                               <span className="text-gray-500 text-xs">Account No</span>
                               <span className="font-mono font-bold text-brand-navy text-sm text-right">{data.bankDetails.accountNumber}</span>
                           </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="h-10 flex items-center justify-between border-b border-gray-200 mb-6 pb-2">
                       <div className="flex items-center gap-3">
                         <span className="font-serif font-bold text-brand-navy text-lg">{settings.businessName}</span>
                         <span className="w-px h-4 bg-gray-300"></span>
                         <span className="text-gray-400 text-xs">Invoice #{data.invoiceNumber}</span>
                       </div>
                       <span className="text-gray-400 text-xs font-medium bg-gray-100 px-2 py-0.5 rounded-full">Page {pageIndex + 1}</span>
                    </div>
                  )}

                  {/* Table */}
                  {pageItems.length > 0 && (
                    <div className="mb-2">
                      {(() => {
                        const showPages = data.items.some(i => i.pages !== undefined && i.pages > 0);
                        return (
                          <>
                            <div className="bg-brand-navy text-white grid grid-cols-12 px-4 py-2 rounded-t font-bold tracking-wider uppercase text-[10px]">
                              <div className="col-span-1">#</div>
                              <div className={showPages ? "col-span-7" : "col-span-8"}>Description</div>
                              {showPages && <div className="col-span-1 text-center">Pages</div>}
                              <div className="col-span-1 text-center">Qty</div>
                              <div className="col-span-2 text-right">Amount</div>
                            </div>
                            
                            <div className="border border-gray-200 border-t-0 rounded-b">
                              {pageItems.map((item, index) => {
                                const itemTotal = item.price * item.quantity;
                                return (
                                  <div key={item.id} className="grid grid-cols-12 px-4 py-3 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                                    <div className="col-span-1 text-gray-400 font-mono text-xs pt-1">
                                      {index + 1}
                                    </div>
                                    <div className={`${showPages ? "col-span-7" : "col-span-8"} pr-4`}>
                                      <h5 className="font-bold text-brand-navy text-sm">{item.description}</h5>
                                      
                                      {/* 5-Column Grid (Smaller Images) */}
                                      {item.images && item.images.length > 0 && (
                                        <div className="mt-2 grid grid-cols-5 gap-2 items-start">
                                          {item.images.map((img, imgIdx) => (
                                            <div 
                                              key={imgIdx} 
                                              className="rounded border border-gray-100 bg-gray-50 shadow-sm overflow-hidden"
                                            >
                                              <img 
                                                src={img} 
                                                alt="Deliverable" 
                                                className="w-full h-auto block"
                                              />
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                    {showPages && (
                                      <div className="col-span-1 text-center font-medium text-gray-800 text-xs pt-1">
                                        {item.pages || '-'}
                                      </div>
                                    )}
                                    <div className="col-span-1 text-center font-medium text-gray-800 text-xs pt-1">
                                      {item.quantity}
                                    </div>
                                    <div className="col-span-2 text-right font-bold text-gray-900 font-mono text-sm pt-1">
                                      {itemTotal.toLocaleString()}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  )}
                </div>
              </div>

              {/* Totals & Footer (Only Last Page) */}
              <div>
                {isLastPage && (
                  <div className="px-10 pb-6">
                    <div className="flex justify-end">
                      <div className="w-1/2 lg:w-5/12 space-y-2">
                        <div className="flex justify-between text-gray-500 font-medium text-xs">
                           <span>Subtotal</span>
                           <span>Rs. {subtotal.toLocaleString()}</span>
                        </div>
                        {data.taxRate > 0 && (
                          <div className="flex justify-between text-gray-500 font-medium text-xs">
                             <span>Tax ({data.taxRate}%)</span>
                             <span>Rs. {taxAmount.toLocaleString()}</span>
                          </div>
                        )}
                        {data.discount > 0 && (
                          <div className="flex justify-between text-green-600 font-medium text-xs">
                             <span>Discount</span>
                             <span>- Rs. {data.discount.toLocaleString()}</span>
                          </div>
                        )}
                        
                        <div className="bg-brand-navy text-white p-4 rounded-lg shadow-lg mt-2">
                           <div className="flex justify-between items-center text-md font-bold border-b border-white/10 pb-2 mb-2">
                              <span>Total Due</span>
                              <span className="text-xl font-serif text-brand-gold">Rs. {total.toLocaleString()}</span>
                           </div>
                           <div className="flex justify-between items-center text-xs opacity-80">
                             <span>Due Date</span>
                             <span>{new Date(data.dueDate).toLocaleDateString()}</span>
                           </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="w-full mt-auto">
                   <div className="bg-gray-50 py-4 px-10 flex justify-between items-center border-t border-gray-200">
                     <div>
                        <p className="text-brand-navy font-serif font-bold text-md">Thank You!</p>
                     </div>
                     <div className="text-right">
                       <p className="text-gray-400 text-xs font-medium">Page {pageIndex + 1} of {pages.length}</p>
                     </div>
                   </div>
                   <div className="h-1.5 w-full bg-brand-gold"></div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};