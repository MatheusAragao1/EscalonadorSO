import { useEffect, useState } from 'react';
import { Button, Modal, Table } from 'react-bootstrap';
import './App.css';

let memoriaPrincipal = 16384
let discosGlobal = 4

let PtempoRealGlobal = []
let filaFeedback1Global = []
let filaFeedback2Global = []
let filaFeedback3Global = []
let filaBloqueadosGlobal = []
let filaCPUGlobal = [{ processId: -1, processorTime: 0, tempoDeQuantumGasto: 0, }, { processId: -1, processorTime: 0, tempoDeQuantumGasto: 0, }, { processId: -1, processorTime: 0, tempoDeQuantumGasto: 0, }, { processId: -1, processorTime: 0, tempoDeQuantumGasto: 0, tempoNaFilaBloqueado: 0 }]

let historicoPTempoReal = []
let historicoFilaFeedback1 = []
let historicoFilaFeedback2 = []
let historicoFilaFeedback3 = []
let historicoCPU = []

function ModalHistorico(props) {
    return (
        <Modal
            {...props}
            size="lg"
            aria-labelledby="contained-modal-title-vcenter"
            centered
        >
            <Modal.Header closeButton>
                <Modal.Title id="contained-modal-title-vcenter">
                    Histórico
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <h4>Histórico PTempoReal</h4>
                {historicoPTempoReal.map((data, index) => {
                    return <p>Momento: {data.momento}<br /> Fila: {JSON.stringify(data.fila)}<br /><br /></p>
                })}<br />
                <h4>Histórico Feedback1</h4>
                {historicoFilaFeedback1.map((data, index) => {
                    return <p>Momento: {data.momento}<br /> Fila: {JSON.stringify(data.fila)}<br /><br /></p>
                })}<br />
                <h4>Histórico Feedback2</h4>
                {historicoFilaFeedback2.map((data, index) => {
                    return <p>Momento: {data.momento}<br /> Fila: {JSON.stringify(data.fila)}<br /><br /></p>
                })}<br />
                <h4>Histórico Feedback3</h4>
                {historicoFilaFeedback3.map((data, index) => {
                    return <p>Momento: {data.momento}<br /> Fila: {JSON.stringify(data.fila)}<br /><br /></p>
                })}<br />
                <h4>Histórico CPU</h4>
                {historicoCPU.map((data, index) => {
                    return <p>Momento: {data.momento}<br /> Fila: {JSON.stringify(data.fila)}<br /><br /></p>
                })}<br />
            </Modal.Body>
            <Modal.Footer>
                <Button onClick={props.onHide}>Fechar</Button>
            </Modal.Footer>
        </Modal>
    );
}


function Escalonador({ listOfProcess, valorDoQuantum }) {
    const [count, setCount] = useState(0);
    const [modalShow, setModalShow] = useState(false);
    const [PTempoReal, setPTempoReal] = useState([]);
    const [filaFeedback1, setFilaFeedback1] = useState([]);
    const [filaFeedback2, setFilaFeedback2] = useState([]);
    const [filaFeedback3, setFilaFeedback3] = useState([]);
    const [filaBloqueados, setFilaBloqueados] = useState([]);
    const [cpus, setCpus] = useState([{ processId: -1, processorTime: 0, tempoDeQuantumGasto: 0, }, { processId: -1, processorTime: 0, tempoDeQuantumGasto: 0, }, { processId: -1, processorTime: 0, tempoDeQuantumGasto: 0, }, { processId: -1, processorTime: 0, tempoDeQuantumGasto: 0, tempoNaFilaBloqueado: 0 }]);

    const schedule = () => {
        setCount((val) => val + 1)
    }

    useEffect(() => {
        listOfProcess.forEach((process) => {
            if (process.arrivalTime == count && process.priority == 0) {
                PtempoRealGlobal.push(process)
            } else if (process.arrivalTime == count && process.priority == 1) {
                filaFeedback1Global.push(process)
            }
        })

        //Diminui o processor Time de todo mundo dentro das CPUS e verifica se algum terminou
        DiminuirProcessorTimeProcessosNaCPUVerificaSeAlgumTerminou()

        //aumenta tempo de quantum gasto para todos na cpu
        AumentaTempoQuantumGastoParaTodosNaCpu()

        //Verifica se alguem na cpu que veio da fila de feedback1 perdeu espaço por quantum e coloca na fila de feedback2
        VerificaFeedback1()

        //Verifica se alguem na cpu que veio da fila de feedback2 perdeu espaço por quantum e coloca na fila de feedback3
        VerificarFeedback2()

        //Verifica se alguem na cpu que veio da fila de feedback3 perdeu espaço por quantum e coloca na fila de feedback3
        VerificarFeedback3()

        //Verificar fila de prontoReal e inserir na CPU
        VerificarFilaProntoRealInserirNaCpu()

        //Verifica fila de feedback1 e inserir na CPU 
        VerificarCPUComparandoFilaFeedback1()

        //Verifica fila de feedback2 e inserir na CPU 
        VerificarCPUComparandoFilaFeedback2()

        //Verifica fila de feedback3 e inserir na CPU 
        VerificarCPUComparandoFilaFeedback3()

        //Verificar fila Bloqueados e colocar em disco quem precisa de disco
        VerificarBloqueadosEColocarEmDisco()



        setPTempoReal(PtempoRealGlobal)
        setFilaFeedback1(filaFeedback1Global)
        setFilaFeedback2(filaFeedback2Global)
        setFilaFeedback3(filaFeedback3Global)
        setFilaBloqueados(filaBloqueadosGlobal)
        setCpus(filaCPUGlobal)

        historicoCPU.push({ momento: count, fila: filaCPUGlobal })
        historicoFilaFeedback1.push({ momento: count, fila: filaFeedback1Global })
        historicoFilaFeedback2.push({ momento: count, fila: filaFeedback2Global })
        historicoFilaFeedback3.push({ momento: count, fila: filaFeedback3Global })
        historicoPTempoReal.push({ momento: count, fila: PtempoRealGlobal })

    }, [count])

    function VerificarBloqueadosEColocarEmDisco(){
        let toRemoveFromBloqueados = []
        for(var i = 0; i < filaBloqueadosGlobal.length; i++){
            
            if(filaBloqueadosGlobal[i].descontadoTempoDisco){
                filaBloqueadosGlobal[i].tempoNaFilaBloqueado++               

                if(filaBloqueadosGlobal[i].tempoNaFilaBloqueado == 2){    
                    if(filaBloqueadosGlobal[i].priority == 1){
                        discosGlobal = parseInt(discosGlobal) + parseInt(filaBloqueadosGlobal[i].disco)
                        filaBloqueadosGlobal[i].disco = 0
                        toRemoveFromBloqueados.push(filaBloqueadosGlobal[i])
                        filaFeedback1Global.push(filaBloqueadosGlobal[i])                        
                    }else if (filaBloqueadosGlobal[i].priority == 2){
                        discosGlobal = parseInt(discosGlobal) + parseInt(filaBloqueadosGlobal[i].disco)
                        filaBloqueadosGlobal[i].disco = 0
                        toRemoveFromBloqueados.push(filaBloqueadosGlobal[i])
                        filaFeedback2Global.push(filaBloqueadosGlobal[i])
                    }else{
                        discosGlobal = parseInt(discosGlobal) + parseInt(filaBloqueadosGlobal[i].disco)
                        filaBloqueadosGlobal[i].disco = 0
                        toRemoveFromBloqueados.push(filaBloqueadosGlobal[i])
                        filaFeedback3Global.push(filaBloqueadosGlobal[i])
                    }
                }
            }
            if(parseInt(discosGlobal) - parseInt(filaBloqueadosGlobal[i].disco) >= 0 && !filaBloqueadosGlobal[i].descontadoTempoDisco){               
                discosGlobal = parseInt(discosGlobal) - parseInt(filaBloqueadosGlobal[i].disco)     
                filaBloqueadosGlobal[i].descontadoTempoDisco = true
            }
        }

        //remove os processos da fila de feedback1 q foram inseridos na cpu
        filaBloqueadosGlobal = filaBloqueadosGlobal.filter((item) => !toRemoveFromBloqueados.includes(item))
    }

    function VerificarCPUComparandoFilaFeedback1() {
        let processosNaCPUOrdenadosPorPrioridade = filaCPUGlobal.sort((a, b) => b.priority - a.priority)
        let toRemoveFromFeedback1 = []
        let index2 = 0
        for (var i = 0; i < 4; i++) {
            processosNaCPUOrdenadosPorPrioridade = filaCPUGlobal.sort((a, b) => b.priority - a.priority)
            if (filaCPUGlobal[i].processId == -1 && filaFeedback1Global.length > 0) {
                filaCPUGlobal[i] = filaFeedback1Global[index2]
                toRemoveFromFeedback1.push(filaFeedback1Global[index2])
                index2++
            } else if (PtempoRealGlobal.length > 0 && processosNaCPUOrdenadosPorPrioridade.filter(x => x.processId == -1 || undefined).length == 0) {
                if (filaCPUGlobal[i].processId == processosNaCPUOrdenadosPorPrioridade[0].processId && filaFeedback1Global[i] !== undefined && filaFeedback1Global[i].priority < processosNaCPUOrdenadosPorPrioridade[0].priority) {
                    if (processosNaCPUOrdenadosPorPrioridade[0].priority == 1) {
                        filaFeedback1Global.push(processosNaCPUOrdenadosPorPrioridade[0])
                    } else if (processosNaCPUOrdenadosPorPrioridade[0].priority == 2) {
                        filaFeedback2Global.push(processosNaCPUOrdenadosPorPrioridade[0])
                    } else if (processosNaCPUOrdenadosPorPrioridade[0].priority == 3) {
                        filaFeedback3Global.push(processosNaCPUOrdenadosPorPrioridade[0])
                    }
                    filaCPUGlobal[i] = filaFeedback1Global[index2]
                    toRemoveFromFeedback1.push(filaFeedback1Global[index2])
                    index2++
                }
            }
            if (filaCPUGlobal[i] == undefined) {
                filaCPUGlobal[i] = { processId: -1, processorTime: 0, tempoDeQuantumGasto: 0, }
            }
        }
        //remove os processos da fila de feedback1 q foram inseridos na cpu
        filaFeedback1Global = filaFeedback1Global.filter((item) => !toRemoveFromFeedback1.includes(item))
    }

    function VerificarCPUComparandoFilaFeedback2() {
        let processosNaCPUOrdenadosPorPrioridade = filaCPUGlobal.sort((a, b) => b.priority - a.priority)
        let toRemoveFromFeedback2 = []
        let index3 = 0
        for (var i = 0; i < 4; i++) {
            if (filaCPUGlobal[i].processId == -1 && filaFeedback2Global.length > 0) {
                filaCPUGlobal[i] = filaFeedback2Global[index3]
                toRemoveFromFeedback2.push(filaFeedback2Global[index3])
                index3++
            } else if (PtempoRealGlobal.length > 0 && processosNaCPUOrdenadosPorPrioridade.filter(x => x.processId == -1 || undefined).length == 0) {
                if (filaCPUGlobal[i].processId == processosNaCPUOrdenadosPorPrioridade[0].processId && filaFeedback2Global[i] !== undefined && filaFeedback2Global[i].priority < processosNaCPUOrdenadosPorPrioridade[0].priority) {
                    if (processosNaCPUOrdenadosPorPrioridade[0].priority == 1) {
                        filaFeedback1Global.push(processosNaCPUOrdenadosPorPrioridade[0])
                    } else if (processosNaCPUOrdenadosPorPrioridade[0].priority == 2) {
                        filaFeedback2Global.push(processosNaCPUOrdenadosPorPrioridade[0])
                    } else if (processosNaCPUOrdenadosPorPrioridade[0].priority == 3) {
                        filaFeedback3Global.push(processosNaCPUOrdenadosPorPrioridade[0])
                    }
                    filaCPUGlobal[i] = filaFeedback2Global[index3]
                    toRemoveFromFeedback2.push(filaFeedback2Global[index3])
                    index3++
                }
            }
            if (filaCPUGlobal[i] == undefined) {
                filaCPUGlobal[i] = { processId: -1, processorTime: 0, tempoDeQuantumGasto: 0, }
            }
        }

        //remove os processos da fila de feedback2 q foram inseridos na cpu
        filaFeedback2Global = filaFeedback2Global.filter((item) => !toRemoveFromFeedback2.includes(item))
    }

    function VerificarCPUComparandoFilaFeedback3() {
        let processosNaCPUOrdenadosPorPrioridade = filaCPUGlobal.sort((a, b) => b.priority - a.priority)
        let toRemoveFromFeedback3 = []
        let index4 = 0
        for (var i = 0; i < 4; i++) {
            if (filaCPUGlobal[i].processId == -1 && filaFeedback3Global.length > 0) {
                filaCPUGlobal[i] = filaFeedback3Global[index4]
                toRemoveFromFeedback3.push(filaFeedback3Global[index4])
                index4++
            } else if (PtempoRealGlobal.length > 0 && processosNaCPUOrdenadosPorPrioridade.filter(x => x.processId == -1 || undefined).length == 0) {
                if (filaCPUGlobal[i].processId == processosNaCPUOrdenadosPorPrioridade[0].processId && filaFeedback3Global[i] !== undefined && filaFeedback3Global[i].priority < processosNaCPUOrdenadosPorPrioridade[0].priority) {
                    if (processosNaCPUOrdenadosPorPrioridade[0].priority == 1) {
                        filaFeedback1Global.push(processosNaCPUOrdenadosPorPrioridade[0])
                    } else if (processosNaCPUOrdenadosPorPrioridade[0].priority == 2) {
                        filaFeedback2Global.push(processosNaCPUOrdenadosPorPrioridade[0])
                    } else if (processosNaCPUOrdenadosPorPrioridade[0].priority == 3) {
                        filaFeedback3Global.push(processosNaCPUOrdenadosPorPrioridade[0])
                    }
                    filaCPUGlobal[i] = filaFeedback1Global[index4]
                    toRemoveFromFeedback3.push(filaFeedback1Global[index4])
                    index4++
                }
            }
            if (filaCPUGlobal[i] == undefined) {
                filaCPUGlobal[i] = { processId: -1, processorTime: 0, tempoDeQuantumGasto: 0, }
            }
        }

        //remove os processos da fila de feedback3 q foram inseridos na cpu
        filaFeedback3Global = filaFeedback3Global.filter((item) => !toRemoveFromFeedback3.includes(item))
    }

    function DiminuirProcessorTimeProcessosNaCPUVerificaSeAlgumTerminou() {
        for (var i = 0; i < 4; i++) {
            if (filaCPUGlobal[i].processId != -1) {
                filaCPUGlobal[i].processorTime = filaCPUGlobal[i].processorTime - 1
                if (filaCPUGlobal[i].processorTime == 0) {
                    filaCPUGlobal[i] = { processId: -1, processorTime: 0, tempoDeQuantumGasto: 0, }
                }
            }
        }
    }

    function AumentaTempoQuantumGastoParaTodosNaCpu() {
        for (var i = 0; i < 4; i++) {
            filaCPUGlobal[i].tempoDeQuantumGasto = filaCPUGlobal[i].tempoDeQuantumGasto + 1
        }
    }

    function VerificaFeedback1() {

        for (var i = 0; i < 4; i++) {
            if (filaCPUGlobal[i].processId != -1) {
                if (filaCPUGlobal[i].disco > 0) {
                    filaBloqueadosGlobal.push(filaCPUGlobal[i])
                    filaCPUGlobal[i] = { processId: -1, processorTime: 0, tempoDeQuantumGasto: 0, }
                } else if (filaCPUGlobal[i].tempoDeQuantumGasto >= valorDoQuantum && filaCPUGlobal[i].priority == 1) {
                    filaCPUGlobal[i].priority = 2
                    filaCPUGlobal[i].tempoDeQuantumGasto = 0
                    filaFeedback2Global.push(filaCPUGlobal[i])
                    filaCPUGlobal[i] = { processId: -1, processorTime: 0, tempoDeQuantumGasto: 0, }
                }
            }
        }
    }

    function VerificarFeedback2() {
        for (var i = 0; i < 4; i++) {
            if (filaCPUGlobal[i].processId != -1) {
                if (filaCPUGlobal[i].disco > 0) {
                    filaBloqueadosGlobal.push(filaCPUGlobal[i])
                    filaCPUGlobal[i] = { processId: -1, processorTime: 0, tempoDeQuantumGasto: 0, }
                } else if (filaCPUGlobal[i].tempoDeQuantumGasto >= valorDoQuantum*2 && filaCPUGlobal[i].priority == 2) {
                    filaCPUGlobal[i].priority = 3
                    filaCPUGlobal[i].tempoDeQuantumGasto = 0
                    filaFeedback3Global.push(filaCPUGlobal[i])
                    filaCPUGlobal[i] = { processId: -1, processorTime: 0, tempoDeQuantumGasto: 0, }
                }
            } else if (filaCPUGlobal[i].disco > 0) {
                filaBloqueadosGlobal.push(filaCPUGlobal[i])
                filaCPUGlobal[i] = { processId: -1, processorTime: 0, tempoDeQuantumGasto: 0, }
            }
        }
    }

    function VerificarFeedback3() {
        for (var i = 0; i < 4; i++) {
            if (filaCPUGlobal[i].processId != -1) {
                if (filaCPUGlobal[i].disco > 0) {
                    filaBloqueadosGlobal.push(filaCPUGlobal[i])
                    filaCPUGlobal[i] = { processId: -1, processorTime: 0, tempoDeQuantumGasto: 0, }
                } else if (filaCPUGlobal[i].tempoDeQuantumGasto >= valorDoQuantum*3 && filaCPUGlobal[i].priority == 3) {
                    filaCPUGlobal[i].tempoDeQuantumGasto = 0
                    filaFeedback3Global.push(filaCPUGlobal[i])
                    filaCPUGlobal[i] = { processId: -1, processorTime: 0, tempoDeQuantumGasto: 0, }
                }
            } else if (filaCPUGlobal[i].disco > 0) {
                filaBloqueadosGlobal.push(filaCPUGlobal[i])
                filaCPUGlobal[i] = { processId: -1, processorTime: 0, tempoDeQuantumGasto: 0, }
            }
        }
    }

    function VerificarFilaProntoRealInserirNaCpu() {
        let processosNaCPUOrdenadosPorPrioridade = filaCPUGlobal.sort((a, b) => b.priority - a.priority)

        let toRemoveFromPtempoReal = []
        let index = 0
        for (var i = 0; i < 4; i++) {
            processosNaCPUOrdenadosPorPrioridade = filaCPUGlobal.sort((a, b) => b.priority - a.priority)
            if (filaCPUGlobal[i].processId == -1 && PtempoRealGlobal.length > 0) {
                filaCPUGlobal[i] = PtempoRealGlobal[index]
                toRemoveFromPtempoReal.push(PtempoRealGlobal[index])
                index++
            } else if (PtempoRealGlobal.length > 0 && processosNaCPUOrdenadosPorPrioridade.filter(x => x.processId == -1 || undefined).length == 0) {
                if (filaCPUGlobal[i].processId == processosNaCPUOrdenadosPorPrioridade[0].processId && processosNaCPUOrdenadosPorPrioridade[0].priority !== 0) {
                    if (processosNaCPUOrdenadosPorPrioridade[0].priority == 1) {
                        filaFeedback1Global.push(processosNaCPUOrdenadosPorPrioridade[0])
                    } else if (processosNaCPUOrdenadosPorPrioridade[0].priority == 2) {
                        filaFeedback2Global.push(processosNaCPUOrdenadosPorPrioridade[0])
                    } else if (processosNaCPUOrdenadosPorPrioridade[0].priority == 3) {
                        filaFeedback3Global.push(processosNaCPUOrdenadosPorPrioridade[0])
                    }
                    filaCPUGlobal[i] = PtempoRealGlobal[index]
                    toRemoveFromPtempoReal.push(PtempoRealGlobal[index])
                    index++
                }
            }
            if (filaCPUGlobal[i] == undefined) {
                filaCPUGlobal[i] = { processId: -1, processorTime: 0, tempoDeQuantumGasto: 0, }
            }
        }
        PtempoRealGlobal = PtempoRealGlobal.filter((item) => !toRemoveFromPtempoReal.includes(item))
    }



    return (
        <>
            <div className="divPrincipal App">
                <div>
                    <h1>Processos | Quantum {valorDoQuantum}</h1>
                    {listOfProcess.map(data => {
                        return <p>Processo: {data.processId} chegada no momento {data.arrivalTime}, prioridade {data.priority} (tempo real), restam {data.processorTime} segundos de duração na CPU e memoria de {data.mbytes} MByte, {data.disco > 0 ? `requer ${data.disco} unidades de disco` : 'sem necessidade de recursos de E/S'}</p>
                    })}
                </div>
                <div>
                    <h3>Momento: {count}</h3>
                    <Button onClick={schedule}>Avançar tempo</Button><br /><br />
                    <Button variant="primary" onClick={() => setModalShow(true)}>
                        Verificar historico das filas
                    </Button>
                </div>
                <ModalHistorico
                    show={modalShow}
                    onHide={() => setModalShow(false)}
                />
            </div>
            <div className="tabelas">
                <div className="pTempoReal">
                    <br />
                    <h3>P. Tempo Real</h3>
                    <Table striped bordered hover size="sm">
                        <tbody>
                            <tr>
                                {PTempoReal.map((data, index) => {
                                    return <td key={index}>{data.processId}</td>
                                })}
                            </tr>

                        </tbody>
                    </Table>
                </div>
            </div>


            <div className="tabelas">
                <div className="pTempoReal">
                    <br />
                    <h3>Pronto Suspenso</h3>
                    <Table striped bordered hover size="sm">
                        <tbody>
                            <tr>
                                <td>Espaço 1</td>
                                <td>Espaço 2</td>
                                <td>Espaço 3</td>
                                <td>Espaço 4</td>
                                <td>Espaço 5</td>
                                <td>Espaço 6</td>
                            </tr>

                        </tbody>
                        <h3>Bloqueado Suspenso</h3>
                        <tbody>
                            <tr>
                                <td>Espaço 1</td>
                                <td>Espaço 2</td>
                                <td>Espaço 3</td>
                                <td>Espaço 4</td>
                                <td>Espaço 5</td>
                                <td>Espaço 6</td>
                            </tr>

                        </tbody>
                    </Table>
                </div>
                <div className="pTempoReal">
                    <br />
                    <h3>CPUs</h3>
                    <Table striped bordered hover size="sm">
                        <tbody>
                            <tr>
                                <td>CPU 1</td>
                                <td>CPU 2</td>
                                <td>CPU 3</td>
                                <td>CPU 4</td>
                            </tr>
                            <tr>
                                {cpus.map((data, index) => {
                                    return <td key={index}>{data != undefined ? (data.processId == -1 ? 'Vazio' : data.processId) : 'Vazio'}</td>
                                })}
                            </tr>
                        </tbody>
                    </Table>
                </div>
            </div>

            <div className="tabelas">
                <div className="pTempoReal">
                    <br />
                    <h3>FEEDBACK</h3>
                    <Table striped bordered hover size="sm">
                        <tbody>
                            <tr>
                                {filaFeedback1.map(data => {
                                    return <td>{data.processId}</td>
                                })}
                            </tr>
                        </tbody>
                        <br />
                        <tbody>
                            <tr>
                                {filaFeedback2.map((data, index) => {
                                    return <td key={index}>{data.processId}</td>
                                })}
                            </tr>
                        </tbody>
                        <br />
                        <tbody>
                            <tr>
                                {filaFeedback3.map((data, index) => {
                                    return <td key={index}>{data.processId}</td>
                                })}
                            </tr>
                        </tbody>
                    </Table>
                </div>
            </div>

            <div className="tabelas">
                <div className="pTempoReal">
                    <br />
                    <h3>Bloqueados</h3>
                    <Table striped bordered hover size="sm">
                        <tbody>
                            <tr>
                                {filaBloqueados.map((data, index) => {
                                    return <td key={index}>{data.processId}</td>
                                })}
                            </tr>
                        </tbody>
                    </Table>
                </div>
            </div>
        </>
    )
}

export default Escalonador;