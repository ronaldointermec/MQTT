import { useEffect, useState } from "react";
import io from "socket.io-client";
import * as XLSX from "xlsx";
import "./App.css"; 

const socket = io("http://localhost:3000");

function App() {
  const [tags, setTags] = useState([]);
  const [isExporting, setIsExporting] = useState(false);
  const [isConnected, setIsConnected] = useState(socket.connected);

  // Paleta Oficial Brady (Conforme Guia Corporativo)
  const BRADY_PRIMARY_BLUE = "#002D72";   
  const BRADY_SECONDARY_BLUE = "#6CACE4"; 
  const BRADY_SUPPORT_TEAL = "#4F868E";   
  const BRADY_COOL_GRAY_8 = "#888B8D";    
  const BRADY_PROCESS_BLACK = "#2C2A29";  

  const STATUS_ALERT_RED = "#ff4757";
  const STATUS_SUCCESS_GREEN = "#2ecc71";

  useEffect(() => {
    socket.on("connect", () => setIsConnected(true));
    socket.on("disconnect", () => setIsConnected(false));

    socket.on("new-tag", (data) => {
      setTags((prev) => {
        // Algoritmo de Agregação e Deduplicação em Tempo Real
        const indexExistente = prev.findIndex((t) => t.Content === data.Content);
        
        if (indexExistente !== -1) {
          const listaAtualizada = [...prev];
          const itemExistente = listaAtualizada[indexExistente];
          
          listaAtualizada[indexExistente] = {
            ...itemExistente,
            count: (itemExistente.count || 1) + 1, // Incrementa o contador do mesmo EPC
            rssi: data.rssi, // Atualiza para o nível de sinal mais recente
            timestamp: data.timestamp, // Atualiza o horário da última leitura
            readermodel: data.readermodel,
            reader: data.reader,
            info: data.info // Mantém atualizado o estado do SO do dispositivo
          };

          // Move o item modificado para o topo (destaque de leitura recente)
          const [itemMovido] = listaAtualizada.splice(indexExistente, 1);
          return [itemMovido, ...prev.filter((_, idx) => idx !== indexExistente)];
        } else {
          // Se for uma tag inédita, adiciona no topo com contador inicial igual a 1
          return [{ ...data, count: 1 }, ...prev];
        }
      });
    });

    socket.on("clear-list", () => {
      const sonar = document.querySelector(".sonar-circle");
      if (sonar) sonar.style.borderColor = STATUS_ALERT_RED;
      setTimeout(() => {
        setTags([]);
        if (sonar) sonar.style.borderColor = BRADY_PRIMARY_BLUE;
      }, 200);
    });

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("new-tag");
      socket.off("clear-list");
    };
  }, []);

  const clearList = () => setTags([]);

  const exportToExcel = () => {
    if (tags.length === 0) return alert("Não há dados!");
    setIsExporting(true);

    setTimeout(() => {
      try {
        const dataToExport = tags.map((t, i) => ({
          Nº: tags.length - i,
          PRODUTO: t.description || "Sem Descrição",
          "CÓDIGO EPC": t.Content,
          CONTAGEM: t.count || 1,
          "SINAL (RSSI)": `${t.rssi} dBm`,
          "LEITOR / HARDWARE": `${t.readermodel} (${t.reader})`,
          // AJUSTE: Inclusão do Sistema Operacional / Info no relatório
          "INFO": t.info || "N/A", 
          DATA: t.dataHoje,
          "ÚLTIMA LEITURA": t.timestamp,
        }));

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);

        // Ajuste das larguras das colunas para comportar o novo campo sem cortar texto
        worksheet["!cols"] = [
          { wch: 6 },  // Nº
          { wch: 30 }, // PRODUTO
          { wch: 35 }, // CÓDIGO EPC
          { wch: 10 }, // CONTAGEM
          { wch: 15 }, // SINAL (RSSI)
          { wch: 25 }, // LEITOR / HARDWARE
          { wch: 18 }, // INFO (Info adicionada)
          { wch: 15 }, // DATA
          { wch: 15 }  // ÚLTIMA LEITURA
        ];

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Inventário MQTT");
        XLSX.writeFile(workbook, `Inventario_MQTT_${new Date().getTime()}.xlsx`);
      } catch (error) {
        console.error("Erro ao exportar:", error);
        alert("Erro ao gerar planilha.");
      } finally {
        setIsExporting(false);
      }
    }, 1500); 
  };

  return (
    <div
      className="screen-wrapper"
      style={{
        backgroundColor: "#00183F", 
        boxSizing: "border-box",
        minHeight: "100vh",
        width: "100vw",
        maxHeight: "100vh",
        display: "flex",
        alignItems: "stretch",
        justifyContent: "stretch",
        overflow: "hidden",
        padding: "20px"
      }}
    >
      <style>{`
        .hide-scrollbar::-webkit-scrollbar,
        .custom-scroll::-webkit-scrollbar {
          display: none !important;
          width: 0 !important;
          height: 0 !important;
        }
        .hide-scrollbar, .custom-scroll {
          -ms-overflow-style: none !important;
          scrollbar-width: none !important;
        }
        .main-container {
          height: 100% !important;
          width: 100% !important;
          background: transparent !important;
          background-image: url('/brady.jpg') !important;
          background-size: 100% 100% !important;
          background-position: center center !important;
          background-repeat: no-repeat !important;
          border-radius: 16px !important;
          overflow: hidden !important;
          box-shadow: 0 20px 50px rgba(0,0,0,0.6) !important;
          padding: 20px !important;
        }
      `}</style>

      <div 
        className="main-container hide-scrollbar" 
        style={{
          fontFamily: "'Montserrat', 'Helvetica', 'Arial', sans-serif",
          color: BRADY_PROCESS_BLACK,
          flex: 1,
          display: "flex",
          flexDirection: "column",
          maxHeight: "100%",
          overflow: "hidden", 
          "--status-color": isConnected ? STATUS_SUCCESS_GREEN : STATUS_ALERT_RED,
          "--live-color": isConnected ? BRADY_PRIMARY_BLUE : STATUS_ALERT_RED
        }}
      >
        {isExporting && (
          <div className="loading-overlay">
            <div className="spinner"></div>
            <p style={{ color: '#FFFFFF', fontWeight: 'bold' }}>GERANDO PLANILHA...</p>
          </div>
        )}

        <header className="app-header" style={{ borderBottom: `2px solid rgba(255, 255, 255, 0.2)`, backgroundColor: "transparent", margin: 0, paddingBottom: "15px" }}>
          <div className="header-info">
            <h1 style={{ color: "#FFFFFF", fontWeight: 800, textShadow: "0 2px 4px rgba(0,0,0,0.3)" }}>
              INVENTÁRIO <span className="live-indicator" style={{ color: isConnected ? STATUS_SUCCESS_GREEN : STATUS_ALERT_RED }}>● {isConnected ? "MQTT LIVE" : "OFFLINE"}</span>
            </h1>
            <p style={{ color: "#E0E0E0", fontWeight: 500, margin: "5px 0 0 0" }}><span className="status-dot"></span> Brady RFID System</p>
          </div>
          <div className="header-actions">
            <button onClick={exportToExcel} className="btn-export" style={{ backgroundColor: BRADY_PRIMARY_BLUE, border: "none", color: "#FFFFFF", boxShadow: "0 4px 10px rgba(0,0,0,0.2)" }}>
              EXPORTAR EXCEL
            </button>
            <button onClick={clearList} className="btn-clear" style={{ borderColor: "#FFFFFF", color: "#FFFFFF", backgroundColor: "rgba(255, 255, 255, 0.1)" }}>
              LIMPAR TELA
            </button>
          </div>
        </header>

        <div className="sonar-section" style={{ backgroundColor: "transparent", height: "180px" }}>
          <div className="sonar-wave" style={{ animationDelay: "0s", background: "rgba(255, 255, 255, 0.25)" }}></div>
          <div className="sonar-wave" style={{ animationDelay: "1s", background: "rgba(255, 255, 255, 0.15)" }}></div>
          <div className="sonar-circle" style={{ borderColor: "#FFFFFF", backgroundColor: "rgba(0, 45, 114, 0.85)", boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)" }}>
            <span className="sonar-number" style={{ color: "#FFFFFF", textShadow: "0 2px 4px rgba(0,0,0,0.2)" }}>{tags.length}</span>
            <span className="sonar-label" style={{ color: "#E0E0E0" }}>Items Únicos</span>
          </div>
        </div>

        <div className="grid-scroll custom-scroll hide-scrollbar" style={{ padding: "10px 0 80px 0", flex: "1", overflowY: "auto", overflowX: "hidden", marginTop: 0 }}>
          {tags.length === 0 ? (
            <div className="empty-state" style={{ color: "#FFFFFF", backgroundColor: "rgba(0, 45, 114, 0.6)", backdropFilter: "blur(4px)", padding: "40px", borderRadius: "8px", marginTop: 0 }}>
              AGUARDANDO TRANFERÊNCIA DE DADOS MQTT...
            </div>
          ) : (
            <div className="tags-grid">
              {tags.map((t, i) => (
                <div 
                  key={i} 
                  className={`tag-card ${i === 0 ? "latest" : ""}`}
                  style={{ 
                    backgroundColor: "#FFFFFF",
                    borderLeft: `6px solid ${i === 0 ? BRADY_PRIMARY_BLUE : BRADY_SUPPORT_TEAL}`,
                    borderColor: i === 0 ? BRADY_PRIMARY_BLUE : "#EAEAEA",
                    boxShadow: i === 0 ? `0 6px 18px rgba(0, 45, 114, 0.25)` : "0 4px 6px rgba(0, 0, 0, 0.08)"
                  }}
                >
                  <div className="status-indicator" style={{ backgroundColor: i === 0 ? BRADY_PRIMARY_BLUE : BRADY_SUPPORT_TEAL }} />
                  <div className="card-content">
                    <div className="card-header">
                      <span className="product-name" style={{ color: BRADY_PROCESS_BLACK, fontWeight: 700 }}>
                        {t.description || "Item RFID"}
                      </span>
                      <span className="tag-count" style={{ color: "#FFFFFF", backgroundColor: BRADY_PRIMARY_BLUE, padding: "2px 8px", borderRadius: "20px", fontSize: "11px", fontWeight: "bold" }}>
                        {t.count}x
                      </span>
                    </div>

                    <div className="epc-code" style={{ color: BRADY_PRIMARY_BLUE, backgroundColor: "#F0F4F8", border: `1px solid ${BRADY_SECONDARY_BLUE}`, padding: "6px", borderRadius: "4px" }}>
                      {t.Content}
                    </div>

                    {/* AJUSTE CONFIRMADO: Campo 'info' adicionado dinamicamente para mostrar a versão do SO corporativo */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "2px", fontSize: "11px", color: BRADY_COOL_GRAY_8, margin: "2px 0 6px 0", fontWeight: 500 }}>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span>📱 HW: <strong>{t.readermodel}</strong> ({t.reader})</span>
                        <span style={{ color: t.rssi > -60 ? STATUS_SUCCESS_GREEN : BRADY_COOL_GRAY_8 }}>
                          📶 <strong>{t.rssi} dBm</strong>
                        </span>
                      </div>
                      <div style={{ fontSize: "10px", color: BRADY_SUPPORT_TEAL }}>
                        🤖 Info: <strong>{t.info}</strong>
                      </div>
                    </div>

                    <div className="card-footer">
                      <span style={{ color: BRADY_COOL_GRAY_8 }}>🕒 Última: {t.timestamp}</span>
                      <span className="status-active" style={{ color: BRADY_SUPPORT_TEAL }}>● ATIVO</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
