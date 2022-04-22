import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';

interface SquareProps {
    isHighlight: boolean,
    value: string | null,
    onClick: () => void,
}
function Square(props: SquareProps) {
    return (
        <button
            className={props.isHighlight ? 'square-highlight' : 'square'}
            onClick={props.onClick}
        >{props.value}
        </button>
    );
}

interface BoardProps {
    highlights: number[],
    squares: (string | null)[],
    onClick: (i: number) => void,
}
class Board extends React.Component<BoardProps> {
    // 単一のマス
    renderSquare(n: number, highlight: boolean) {
        return (
            <Square
                key={n}
                isHighlight={highlight}
                value={this.props.squares[n]}
                onClick={() => this.props.onClick(n)}
            />
        );
    }

    // 行
    renderRow(rowNumber: number) {
        let rows = [];
        for (let col = 0; col < 3; col++) {
            const highlight = this.props.highlights.includes((3 * rowNumber) + col);
            rows.push(this.renderSquare((3 * rowNumber) + col, highlight));
        }
        return <div key={3 * rowNumber} className="board-row">{rows}</div>;
    }

    render() {
        let board = [];
        for (let row = 0; row < 3; row++) {
            board.push(this.renderRow(row));
        }
        return <div>{board}</div>
    }
}

interface GameState {
    history: (string | null)[][],
    stepNumber: number,
    xIsNext: boolean,
    sashite: string[],
    isAscOrder: boolean,
}
class Game extends React.Component<any, GameState> {
    // コンストラクタは，コンストラクタで何をしたいときだけオーバーライドして使用する．
    constructor(props: any) {
        super(props);
        this.state = {
            history: [
                Array(9).fill(null),
            ],
            stepNumber: 0,
            xIsNext: true,
            sashite: [''],
            isAscOrder: true,
        }
    }

    handleClickSquare(n: number) {

        // マスをクリックされた段階で現在のステップ以上の履歴を捨ててhistoryを更新する．
        const history = this.state.history.slice(0, this.state.stepNumber + 1);
        const sashite = this.state.sashite.slice(0, this.state.stepNumber + 1);

        const latest = history[history.length - 1].slice();
        // 終局 or 着手済み
        if (getWinner(latest) || latest[n] !== null) {
            return
        }

        // 着手した新しい盤面を作る
        const newBoard = latest;
        newBoard[n] = this.state.xIsNext ? 'X' : 'O';

        // 指し手
        const newSashite = squareName(n);

        this.setState({
            history: history.concat([newBoard]),
            stepNumber: history.length,
            xIsNext: !this.state.xIsNext,
            sashite: sashite.concat(newSashite),
        });
    }

    jumpTo(step: number) {
        this.setState({
            stepNumber: step,
            xIsNext: step % 2 === 0,
        });
    }

    renderOrderButton() {
        const sign = this.state.isAscOrder ? '▲' : '▼';
        const changeOrder = () => this.setState({ isAscOrder: !this.state.isAscOrder });
        return (
            <button
                className='order'
                onClick={changeOrder}>
                {sign}</button>
        );
    }

    moves() {
        const history = this.state.history;
        let moves = history.map((move, step) => {
            const name = step == this.state.stepNumber
                ? "move-current" : "move";
            const desc = step
                ? `Go to move #${step}`
                : 'Go to game start';
            const sashite = this.state.sashite[step];

            return (
                <li key={step}>
                    <button
                        className={name}
                        onClick={() => this.jumpTo(step)}>
                        {`${desc} ${sashite}`}</button>
                </li>
            )
        });

        if (!this.state.isAscOrder) {
            moves = moves.reverse();
        }

        return moves;
    }

    status() {
        let current = this.getCurrent();
        const winner = getWinner(current);

        const filled = !current.includes(null);
        let status: string | null = null;
        if (winner) {
            status = `Winner: ${winner}`;
        } else if (filled) {
            status = `Draw!`;
        } else {
            status = `Next player: ${this.state.xIsNext ? "X" : "O"}`;
        }
        return status;
    }

    getCurrent() {
        const history = this.state.history;
        return history[this.state.stepNumber];
    }

    getWinSquareNums() {
        return winSquareNums(this.getCurrent());
    }

    render() {
        return (
            <div className="game" >
                <div className="game-board">
                    <Board
                        highlights={this.getWinSquareNums()}
                        squares={this.getCurrent()}
                        onClick={(i: number) => this.handleClickSquare(i)}
                    />
                </div>
                <div className="game-info">
                    <div>{this.status()}</div>
                    <div>{this.renderOrderButton()}</div>
                    <ol>{this.moves()}</ol>
                </div>
            </div>
        );
    }
}

const root = ReactDOM.createRoot(
    document.getElementById('root') as HTMLElement
);
root.render(
    <React.StrictMode>
        <Game />
    </React.StrictMode>
);


function getWinner(squares: (string | null)[]) {
    const winNums = winSquareNums(squares);
    if (winNums.length > 0) {
        return squares[winNums[0]];
    }
    return null;
}

/** 並んだ3マスを返す */
function winSquareNums(squares: (string | null)[]): number[] {
    const lines = [
        [0, 1, 2],
        [3, 4, 5],
        [6, 7, 8],
        [0, 3, 6],
        [1, 4, 7],
        [2, 5, 8],
        [0, 4, 8],
        [2, 4, 6],
    ];
    for (let i = 0; i < lines.length; i++) {
        const [a, b, c] = lines[i];
        if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
            return lines[i];
        }
    }
    return [];
}

function squareName(n: number): string {
    const lines = [
        '(col 0, row 0)',
        '(col 1, row 0)',
        '(col 2, row 0)',
        '(col 0, row 1)',
        '(col 1, row 1)',
        '(col 2, row 1)',
        '(col 0, row 2)',
        '(col 1, row 2)',
        '(col 2, row 2)',
    ];
    return lines[n];
}
