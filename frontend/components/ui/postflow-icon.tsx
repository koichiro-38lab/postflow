interface PostFlowIconProps {
    className?: string;
}

export function PostFlowIcon({
    className = "w-12 sm:w-14 h-auto",
}: PostFlowIconProps) {
    return (
        <svg
            width="100%"
            height="100%"
            viewBox="0 0 500 222"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            <g
                transform="matrix(1,0,0,1,-0.481648,-117.082)"
                fill="currentColor"
            >
                <g transform="matrix(1.82044,0,0,1.82044,-420.403,-245.61)">
                    <path d="M505.533,199.233L471.533,233.233L319.933,233.233L353.833,199.333" />
                </g>
                <g transform="matrix(1.82044,0,0,1.82044,-501.185,-166.649)">
                    <path d="M485.533,199.233L451.533,233.233L319.933,233.233L353.833,199.333" />
                </g>
                <g transform="matrix(1.82044,0,0,1.82044,-581.938,-85.8959)">
                    <path d="M465.533,199.233L431.533,233.233L319.933,233.233L353.833,199.333" />
                </g>
            </g>
        </svg>
    );
}
