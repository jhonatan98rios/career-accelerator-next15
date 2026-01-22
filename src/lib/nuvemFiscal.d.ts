export type NuvemFiscalBody = {
  provedor: string;
  ambiente: string;
  referencia: string;
  infDPS: {
    tpAmb: number;
    dhEmi: string;
    verAplic: string;
    dCompet: string;
    subst: {
      chSubstda: string;
      cMotivo: string;
      xMotivo: string;
    };
    prest: {
      CNPJ: string;
      CPF: string;
      regTrib: {
        regEspTrib: number;
      };
    };
    toma: {
      orgaoPublico: boolean;
      CNPJ: string;
      CPF: string;
      NIF: string;
      cNaoNIF: number;
      CAEPF: string;
      IM: string;
      IE: string;
      xNome: string;
      end: {
        endNac: {
          cMun: string;
          CEP: string;
        };
        endExt: {
          cPais: string;
          cEndPost: string;
          xCidade: string;
          xEstProvReg: string;
        };
        xLgr: string;
        tpLgr: string;
        nro: string;
        xCpl: string;
        xBairro: string;
      };
      fone: string;
      email: string;
    };
    interm: {
      CNPJ: string;
      CPF: string;
      NIF: string;
      cNaoNIF: number;
      CAEPF: string;
      IM: string;
      IE: string;
      xNome: string;
      end: {
        endNac: {
          cMun: string;
          CEP: string;
        };
        endExt: {
          cPais: string;
          cEndPost: string;
          xCidade: string;
          xEstProvReg: string;
        };
        xLgr: string;
        tpLgr: string;
        nro: string;
        xCpl: string;
        xBairro: string;
      };
      fone: string;
      email: string;
    };
    serv: {
      locPrest: {
        cLocPrestacao: string;
        cPaisPrestacao: string;
      };
      cServ: {
        cTribNac: string;
        cTribMun: string;
        CNAE: string;
        xDescServ: string;
        cNBS: string;
        cNatOp: string;
        cSitTrib: string;
      };
      comExt: {
        mdPrestacao: number;
        vincPrest: number;
        tpMoeda: string;
        vServMoeda: number;
        mecAFComexP: string;
        mecAFComexT: string;
        movTempBens: number;
        nDI: string;
        nRE: string;
        mdic: number;
      };
      lsadppu: {
        categ: number;
        objeto: number;
        extensao: string;
        nPostes: string;
      };
      obra: {
        cObra: string;
        inscImobFisc: string;
        end: {
          CEP: string;
          endExt: {
            cEndPost: string;
            xCidade: string;
            xEstProvReg: string;
          };
          xLgr: string;
          tpLgr: string;
          nro: string;
          xCpl: string;
          xBairro: string;
        };
      };
      atvEvento: {
        xNome: string;
        desc: string;
        dtIni: string;
        dtFim: string;
        idAtvEvt: string;
        id: string;
        end: {
          CEP: string;
          endExt: {
            cEndPost: string;
            xCidade: string;
            xEstProvReg: string;
          };
          xLgr: string;
          tpLgr: string;
          nro: string;
          xCpl: string;
          xBairro: string;
        };
      };
      explRod: {
        categVeic: string;
        nEixos: string;
        rodagem: number;
        sentido: string;
        placa: string;
        codAcessoPed: string;
        codContrato: string;
      };
      infoCompl: {
        idDocTec: string;
        docRef: string;
        xInfComp: string;
      };
    };
    valores: {
      vServPrest: {
        vReceb: number;
        vServ: number;
      };
      vDescCondIncond: {
        vDescIncond: number;
        vDescCond: number;
      };
      vDedRed: {
        pDR: number;
        vDR: number;
        documentos: {
          docDedRed: Array<{
            chNFSe: string;
            chNFe: string;
            NFSeMun: {
              cMunNFSeMun: string;
              nNFSeMun: number;
              cVerifNFSeMun: string;
            };
            NFNFS: {
              nNFS: number;
              modNFS: number;
              serieNFS: string;
            };
            nDocFisc: string;
            nDoc: string;
            tpDedRed: number;
            xDescOutDed: string;
            dtEmiDoc: string;
            vDedutivelRedutivel: number;
            vDeducaoReducao: number;
            fornec: {
              CNPJ: string;
              CPF: string;
              NIF: string;
              cNaoNIF: number;
              CAEPF: string;
              IM: string;
              IE: string;
              xNome: string;
              end: {
                endNac: object;
                endExt: object;
                xLgr: string;
                tpLgr: string;
                nro: string;
                xCpl: string;
                xBairro: string;
              };
              fone: string;
              email: string;
            };
          }>;
        };
      };
      trib: {
        tribMun: {
          tribISSQN: number;
          cLocIncid: string;
          cPaisResult: string;
          BM: {
            tpBM: number;
            nBM: string;
            vRedBCBM: number;
            pRedBCBM: number;
          };
          exigSusp: {
            tpSusp: number;
            nProcesso: string;
          };
          tpImunidade: number;
          vBC: number;
          pAliq: number;
          vISSQN: number;
          tpRetISSQN: number;
          vLiq: number;
        };
        tribFed: {
          piscofins: {
            CST: string;
            vBCPisCofins: number;
            pAliqPis: number;
            pAliqCofins: number;
            vPis: number;
            vCofins: number;
            tpRetPisCofins: number;
          };
          vRetCP: number;
          vRetIRRF: number;
          vRetCSLL: number;
        };
        totTrib: {
          vTotTrib: {
            vTotTribFed: number;
            vTotTribEst: number;
            vTotTribMun: number;
          };
          pTotTrib: {
            pTotTribFed: number;
            pTotTribEst: number;
            pTotTribMun: number;
          };
          indTotTrib: number;
          pTotTribSN: number;
        };
      };
    };
  };
};
